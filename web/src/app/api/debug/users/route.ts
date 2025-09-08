import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";

export async function GET() {
  try {
    const conn = await getConnection();
    
    // Get all users
    const [rows]: any = await conn.execute("SELECT id, username, email, role, status FROM users");
    await conn.end();
    
    return NextResponse.json({ users: rows });
  } catch (error) {
    console.error("Users query error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
