import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";

export async function GET() {
  try {
    const conn = await getConnection();
    
    // Test database connection
    const [rows]: any = await conn.execute("SELECT COUNT(*) as count FROM users");
    await conn.end();
    
    return NextResponse.json({ 
      status: "connected", 
      userCount: rows[0].count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json({ 
      status: "error", 
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
