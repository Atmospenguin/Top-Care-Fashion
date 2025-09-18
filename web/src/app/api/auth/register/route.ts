import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import crypto from "crypto";

function hash(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: NextRequest) {
  const { username, email, password, dob, gender } = await req.json();
  if (!username || !email || !password) return NextResponse.json({ error: "missing fields" }, { status: 400 });

  const trimmedDob = typeof dob === "string" ? dob.trim() : "";
  let normalizedDob: string | null = null;
  if (trimmedDob) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDob)) {
      return NextResponse.json({ error: "invalid dob" }, { status: 400 });
    }
    normalizedDob = trimmedDob;
  }

  let normalizedGender: "Male" | "Female" | null = null;
  if (typeof gender === "string" && gender.trim()) {
    const normalized = gender.trim();
    if (normalized !== "Male" && normalized !== "Female") {
      return NextResponse.json({ error: "invalid gender" }, { status: 400 });
    }
    normalizedGender = normalized as "Male" | "Female";
  }

  const conn = await getConnection();
  try {
    await conn.execute(
      "INSERT INTO users (username, email, password_hash, role, status, dob, gender) VALUES (?, ?, ?, 'User', 'active', ?, ?)",
      [username, email, hash(password), normalizedDob, normalizedGender]
    );
    const [rows]: any = await conn.execute("SELECT id, username, email, role, status, is_premium AS isPremium, premium_until AS premiumUntil, dob, gender FROM users WHERE email = ?", [email]);
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
    const res = NextResponse.json({ user });
    res.cookies.set("tc_session", String(user.id), { httpOnly: true, sameSite: "lax", path: "/" });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  } finally {
    await conn.end();
  }
}
