import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import crypto from "crypto";

function hash(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: NextRequest) {
  const { username, email, password } = await req.json();
  if (!username || !email || !password) return NextResponse.json({ error: "missing fields" }, { status: 400 });
  const conn = await getConnection();
  try {
    await conn.execute(
      "INSERT INTO users (username, email, password_hash, role, status) VALUES (?, ?, ?, 'User', 'active')",
      [username, email, hash(password)]
    );
    const [rows]: any = await conn.execute("SELECT id, username, email, role, status FROM users WHERE email = ?", [email]);
    const user = rows[0];
    const res = NextResponse.json({ user });
    res.cookies.set("tc_session", String(user.id), { httpOnly: true, sameSite: "lax", path: "/" });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  } finally {
    await conn.end();
  }
}
