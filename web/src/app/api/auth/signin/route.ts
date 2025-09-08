import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import crypto from "crypto";

function hash(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "missing fields" }, { status: 400 });
  const conn = await getConnection();
  try {
    const [rows]: any = await conn.execute(
      "SELECT id, username, email, role, status, password_hash FROM users WHERE email = ?",
      [email]
    );
    if (!rows.length) return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
    const row = rows[0];
    if (row.password_hash && row.password_hash !== hash(password)) {
      return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
    }
    if (row.status === "suspended") return NextResponse.json({ error: "account suspended" }, { status: 403 });
    const user = { id: row.id, username: row.username, email: row.email, role: row.role, status: row.status };
    const res = NextResponse.json({ user });
    res.cookies.set("tc_session", String(user.id), { httpOnly: true, sameSite: "lax", path: "/" });
    return res;
  } finally {
    await conn.end();
  }
}
