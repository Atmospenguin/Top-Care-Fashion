import { NextResponse } from "next/server";
import { getConnection, toNumber } from "@/lib/db";
import { createSupabaseServer } from "@/lib/supabase";

export async function GET() {
  try {
    const conn = await getConnection();
    const [rows]: any = await conn.execute("SELECT COUNT(*) AS count FROM users");
    await conn.end();

    const total = Array.isArray(rows) && rows.length ? toNumber(rows[0].count) ?? 0 : 0;

    // Supabase check: also try a lightweight auth ping
    const supabase = await createSupabaseServer();
    const { data: authData } = await supabase.auth.getUser();

    return NextResponse.json({
      status: "connected",
      userCount: total,
      supabaseAuth: Boolean(authData?.user) ? "session" : "no-session",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
