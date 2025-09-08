import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getConnection } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    
    // Simple admin password for testing
    if (password !== "admin123") {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Find admin user in database
    const conn = await getConnection();
    try {
      const [rows]: any = await conn.execute(
        "SELECT id FROM users WHERE role = 'Admin' AND status = 'active' LIMIT 1"
      );
      
      if (!rows.length) {
        return NextResponse.json({ error: "No admin user found" }, { status: 404 });
      }

      const adminId = rows[0].id;

      // Set admin session cookie
      const store = await cookies();
      store.set("tc_session", adminId.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return NextResponse.json({ success: true, message: "Admin logged in", adminId });
    } finally {
      await conn.end();
    }
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
