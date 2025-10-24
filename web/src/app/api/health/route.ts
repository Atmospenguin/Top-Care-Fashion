import { NextResponse } from "next/server";
import { JWT } from "google-auth-library";

export const runtime = "nodejs";
const normalize = (s="") => s.replace(/\\n/g,"\n").replace(/\r/g,"").replace(/^"|"$/g,"").trim();

export async function GET() {
  // 1) env presence (no secrets leaked)
  const envPresence = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    GOOGLE_CLOUD_PROJECT: !!process.env.GOOGLE_CLOUD_PROJECT,
    GOOGLE_CLIENT_EMAIL: !!process.env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
  };

  // 2) Google auth token mint
  let googleAuth: "ok" | "fail" = "fail";
  try {
    const client = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL!,
      key: normalize(process.env.GOOGLE_PRIVATE_KEY!),
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    await client.authorize();
    googleAuth = "ok";
  } catch {
    googleAuth = "fail";
  }

  // 3) Supabase REST HEAD ping
  let supabase: "ok" | "fail" = "fail";
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const r = await fetch(`${url}/rest/v1/`, { method: "HEAD", headers: { apikey: anon, Authorization: `Bearer ${anon}` } });
    if (r.ok) supabase = "ok";
  } catch {}

  return NextResponse.json({ envPresence, googleAuth, supabase });
}
