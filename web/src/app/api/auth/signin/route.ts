import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSupabaseServer } from "@/lib/supabase";
import { Gender, UserRole, UserStatus } from "@prisma/client";

function hash(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function mapRole(value: UserRole | null | undefined): "User" | "Admin" {
  return value === UserRole.ADMIN ? "Admin" : "User";
}

function mapStatus(value: UserStatus | null | undefined): "active" | "suspended" {
  return value === UserStatus.SUSPENDED ? "suspended" : "active";
}

function mapGender(value: Gender | null | undefined): "Male" | "Female" | null {
  if (value === Gender.MALE) return "Male";
  if (value === Gender.FEMALE) return "Female";
  return null;
}

async function ensureLocalUser(supabaseUserId: string, email: string) {
  const existingBySupabase = await prisma.users.findUnique({
    where: { supabase_user_id: supabaseUserId },
    select: { id: true },
  });
  if (existingBySupabase) return existingBySupabase.id;

  const existingByEmail = await prisma.users.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingByEmail) {
    const updated = await prisma.users.update({
      where: { id: existingByEmail.id },
      data: { supabase_user_id: supabaseUserId },
      select: { id: true },
    });
    return updated.id;
  }

  const fallbackUsername = email.split("@")[0] || `user_${supabaseUserId.slice(0, 8)}`;
  const created = await prisma.users.create({
    data: {
      username: fallbackUsername,
      email,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      supabase_user_id: supabaseUserId,
    },
    select: { id: true },
  });
  return created.id;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email, password } = body as Record<string, unknown>;

  const normalizedEmail = typeof email === "string" ? email.trim() : "";
  const normalizedPassword = typeof password === "string" ? password : "";

  if (!normalizedEmail || !normalizedPassword) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const supabase = await createSupabaseServer();
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: normalizedPassword,
  });

  if (!signInError && signInData?.user) {
    await ensureLocalUser(signInData.user.id, normalizedEmail);
    return NextResponse.json({ ok: true, supabaseUserId: signInData.user.id });
  }

  const user = await prisma.users.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      status: true,
      password_hash: true,
      is_premium: true,
      premium_until: true,
      dob: true,
      gender: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
  }

  if (user.password_hash && user.password_hash !== hash(normalizedPassword)) {
    return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
  }

  if (mapStatus(user.status) === "suspended") {
    return NextResponse.json({ error: "account suspended" }, { status: 403 });
  }

  const dob = user.dob ? user.dob.toISOString().slice(0, 10) : null;
  const responseUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: mapRole(user.role),
    status: mapStatus(user.status),
    dob,
    gender: mapGender(user.gender),
    isPremium: Boolean(user.is_premium),
    premiumUntil: user.premium_until ?? null,
  };

  const response = NextResponse.json({ user: responseUser, fallback: true });
  response.cookies.set("tc_session", String(user.id), { httpOnly: true, sameSite: "lax", path: "/" });
  return response;
}
