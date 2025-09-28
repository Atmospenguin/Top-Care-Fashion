import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase";

export async function POST() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  const res = NextResponse.json({ ok: true });
  res.cookies.set("tc_session", "", { httpOnly: true, maxAge: 0, path: "/" });
  return res;
}
