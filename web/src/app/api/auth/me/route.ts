import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";

export async function GET() {
  const cookieStore = await cookies();
  const sid = cookieStore.get("tc_session")?.value;
  if (!sid) return NextResponse.json({ user: null });
  const conn = await getConnection();
  const [rows]: any = await conn.execute(
    "SELECT id, username, email, role, status, is_premium AS isPremium, premium_until AS premiumUntil FROM users WHERE id = ?",
    [sid]
  );
  await conn.end();
  if (!rows.length) return NextResponse.json({ user: null });
  return NextResponse.json({ user: rows[0] });
}
