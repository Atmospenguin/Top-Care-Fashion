import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

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

function normalizeGenderInput(gender: unknown): { value: "Male" | "Female" | null; present: boolean } {
  if (gender === undefined) return { value: null, present: false };
  if (gender === null) return { value: null, present: true };
  if (typeof gender !== "string") return { value: null, present: false };
  const trimmed = gender.trim();
  if (!trimmed) return { value: null, present: true };
  if (trimmed !== "Male" && trimmed !== "Female") {
    throw new Error("invalid gender");
  }
  return { value: trimmed as "Male" | "Female", present: true };
}

export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json().catch(() => ({}));
  const { username, email } = payload as Record<string, unknown>;

  const updates: string[] = [];
  const values: Array<string | null> = [];

  if (username !== undefined) {
    if (typeof username !== "string" || !username.trim()) {
      return NextResponse.json({ error: "invalid username" }, { status: 400 });
    }
    updates.push("username = ?");
    values.push(username.trim());
  }

  if (email !== undefined) {
    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "invalid email" }, { status: 400 });
    }
    updates.push("email = ?");
    values.push(email.trim());
  }

  let dobUpdate: { value: string | null; present: boolean };
  let genderUpdate: { value: "Male" | "Female" | null; present: boolean };
  try {
    dobUpdate = normalizeDobInput((payload as any).dob);
    genderUpdate = normalizeGenderInput((payload as any).gender);
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid input";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (dobUpdate.present) {
    updates.push("dob = ?");
    values.push(dobUpdate.value);
  }

  if (genderUpdate.present) {
    updates.push("gender = ?");
    values.push(genderUpdate.value);
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No fields provided" }, { status: 400 });
  }

  values.push(String(sessionUser.id));

  const conn = await getConnection();
  try {
    await conn.execute(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);
    const [rows]: any = await conn.execute(
      "SELECT id, username, email, role, status, is_premium AS isPremium, premium_until AS premiumUntil, dob, gender FROM users WHERE id = ?",
      [sessionUser.id]
    );
    if (!rows.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const user = rows[0];
    if (user?.dob instanceof Date) {
      user.dob = user.dob.toISOString().slice(0, 10);
    }
    if (user && user.gender === undefined) {
      user.gender = null;
    }
    if (user) {
      user.isPremium = !!user.isPremium;
      user.premiumUntil = user.premiumUntil ?? null;
    }
    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "update failed" }, { status: 400 });
  } finally {
    await conn.end();
  }
}
