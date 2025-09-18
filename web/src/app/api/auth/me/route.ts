import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";

export async function GET() {
  const cookieStore = await cookies();
  const sid = cookieStore.get("tc_session")?.value;
  if (!sid) return NextResponse.json({ user: null });
  const conn = await getConnection();
  const [rows]: any = await conn.execute(
    "SELECT id, username, email, role, status, is_premium AS isPremium, premium_until AS premiumUntil, dob, gender FROM users WHERE id = ?",
    [sid]
  );
  await conn.end();
  if (!rows.length) return NextResponse.json({ user: null });
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
}
