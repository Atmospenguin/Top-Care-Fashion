import { NextResponse } from "next/server";
import { ImageAnnotatorClient } from "@google-cloud/vision";

export const runtime = "nodejs";

// helper to fix newline formatting in private keys
const normalize = (s = "") =>
  s.replace(/\\n/g, "\n").replace(/\r/g, "").replace(/^"|"$/g, "").trim();

export async function GET() {
  // 1️⃣ Environment variable presence
  const envPresence = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    GOOGLE_CLOUD_PROJECT: !!process.env.GOOGLE_CLOUD_PROJECT,
    GOOGLE_CLIENT_EMAIL: !!process.env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
  };

  // 2️⃣ Google Cloud Vision: test authentication
  let googleAuth: "ok" | "fail" = "fail";
  try {
    const vision = new ImageAnnotatorClient({
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL!,
        private_key: normalize(process.env.GOOGLE_PRIVATE_KEY!),
      },
    });
    await vision.getProjectId(); // simple harmless auth call
    googleAuth = "ok";
  } catch (err) {
    console.error("Google auth failed:", err);
  }

  // 3️⃣ Supabase: test REST reachability
  let supabase: "ok" | "fail" = "fail";
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const res = await fetch(`${url}/rest/v1/`, {
      method: "HEAD",
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
      },
      cache: "no-store",
    });
    if (res.ok) supabase = "ok";
  } catch (err) {
    console.error("Supabase check failed:", err);
  }

  return NextResponse.json({ envPresence, googleAuth, supabase });
}
