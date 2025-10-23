import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSupabaseServer } from "@/lib/supabase";
import { Gender, UserRole, UserStatus } from "@prisma/client";
import { signLegacyToken } from "@/lib/jwt";

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

  // 1) 先用 Supabase 登录
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: normalizedPassword,
  });

  if (signInError || !signInData?.user) {
    // 后备：走本地 users 表的密码哈希（你已有的逻辑，保持不变）
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
    if (user.status === "SUSPENDED") {
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
      gender: user.gender === "MALE" ? "Male" : user.gender === "FEMALE" ? "Female" : null,
      isPremium: Boolean(user.is_premium),
      premiumUntil: user.premium_until ?? null,
    };

    // 为移动端返回一个可用于 Bearer 的本地签名 token
    const legacyAccessToken = signLegacyToken({ uid: user.id, kind: "legacy" }, { expiresIn: 60 * 60 * 24 * 7 });
    const resp = NextResponse.json({ user: responseUser, fallback: true, access_token: legacyAccessToken, token_type: 'legacy' });
    resp.cookies.set("tc_session", String(user.id), { httpOnly: true, sameSite: "lax", path: "/" });
    return resp;
  }

  // 2) 绑定 / 同步本地 users 表
  const userId = await ensureLocalUser(signInData.user.id, normalizedEmail);

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      status: true,
      is_premium: true,
      premium_until: true,
      dob: true,
      gender: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const dob = user.dob ? user.dob.toISOString().slice(0, 10) : null;
  const responseUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role === "ADMIN" ? "Admin" : "User",
    status: user.status === "SUSPENDED" ? "suspended" : "active",
    dob,
    gender: user.gender === "MALE" ? "Male" : user.gender === "FEMALE" ? "Female" : null,
    isPremium: Boolean(user.is_premium),
    premiumUntil: user.premium_until ?? null,
  };

  // 3) 关键：稳健获取 session（两步兜底）
  //    A. 先从 signInData.session 拿
  let session: any = signInData.session ?? null;

  //    B. 还没有？再调用 getSession() 兜底
  if (!session) {
    const { data: sessionData } = await supabase.auth.getSession();
    session = sessionData?.session ?? null;
  }

  const accessToken = session?.access_token ?? null;
  const refreshToken = session?.refresh_token ?? null;

  const response = NextResponse.json({
    user: responseUser,
    source: "supabase",
    access_token: accessToken,      // ← mobile 就靠这个
    refresh_token: refreshToken,    // ← 可选
  });

  // 给 web（浏览器）留 cookie（保持你之前的逻辑）
  if (session) {
    response.cookies.set("sb-access-token", session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    response.cookies.set("sb-refresh-token", session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  return response;
}
