import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getConnection } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (password !== "admin123") {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const conn = await getConnection();
    try {
      const [rows]: any = await conn.execute(
        "SELECT id FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE' LIMIT 1"
      );

      if (!rows.length) {
        return NextResponse.json({ error: "No admin user found" }, { status: 404 });
      }

      const adminId = Number(rows[0].id);

      const store = await cookies();
      store.set("tc_session", adminId.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7,
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
