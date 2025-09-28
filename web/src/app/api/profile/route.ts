import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Gender, UserRole, UserStatus } from "@prisma/client";

function normalizeDobInput(dob: unknown): { value: string | null; present: boolean } {
  if (dob === undefined) return { value: null, present: false };
  if (dob === null) return { value: null, present: true };
  if (typeof dob !== "string") return { value: null, present: false };
  const trimmed = dob.trim();
  if (!trimmed) return { value: null, present: true };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error("invalid dob");
  }
  return { value: trimmed, present: true };
}

function normalizeGenderInput(gender: unknown): { value: "MALE" | "FEMALE" | null; present: boolean } {
  if (gender === undefined) return { value: null, present: false };
  if (gender === null) return { value: null, present: true };
  if (typeof gender !== "string") return { value: null, present: false };
  const trimmed = gender.trim();
  if (!trimmed) return { value: null, present: true };
  if (trimmed !== "Male" && trimmed !== "Female") {
    throw new Error("invalid gender");
  }
  return { value: trimmed === "Male" ? "MALE" : "FEMALE", present: true };
}

function mapRole(value: UserRole | null | undefined): "User" | "Admin" {
  return value === UserRole.ADMIN ? "Admin" : "User";
}

function mapStatus(value: UserStatus | null | undefined): "active" | "suspended" {
  return value === UserStatus.SUSPENDED ? "suspended" : "active";
}

function mapGenderOut(value: Gender | null | undefined): "Male" | "Female" | null {
  if (value === Gender.MALE) return "Male";
  if (value === Gender.FEMALE) return "Female";
  return null;
}

export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json().catch(() => ({}));
  const { username, email } = payload as Record<string, unknown>;

  const data: Record<string, unknown> = {};

  if (username !== undefined) {
    if (typeof username !== "string" || !username.trim()) {
      return NextResponse.json({ error: "invalid username" }, { status: 400 });
    }
    data.username = username.trim();
  }

  if (email !== undefined) {
    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "invalid email" }, { status: 400 });
    }
    data.email = email.trim();
  }

  let dobUpdate: { value: string | null; present: boolean };
  let genderUpdate: { value: "MALE" | "FEMALE" | null; present: boolean };
  try {
    dobUpdate = normalizeDobInput((payload as any).dob);
    genderUpdate = normalizeGenderInput((payload as any).gender);
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid input";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (dobUpdate.present) {
    data.dob = dobUpdate.value ? new Date(dobUpdate.value) : null;
  }

  if (genderUpdate.present) {
    data.gender = genderUpdate.value as Gender | null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields provided" }, { status: 400 });
  }
  try {
    await prisma.users.update({ where: { id: Number(sessionUser.id) }, data });

    const user = await prisma.users.findUnique({
      where: { id: Number(sessionUser.id) },
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
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: mapRole(user.role),
        status: mapStatus(user.status),
        isPremium: Boolean(user.is_premium),
        premiumUntil: user.premium_until ?? null,
        dob: user.dob ? user.dob.toISOString().slice(0, 10) : null,
        gender: mapGenderOut(user.gender),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "update failed" }, { status: 400 });
  }
}
