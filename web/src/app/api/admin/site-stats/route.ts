import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { users, listings, sold, rating } = body;

    const connection = await getConnection();
    
    await connection.execute(
      `UPDATE site_stats SET 
       total_users = ?, total_listings = ?, total_sold = ?, avg_rating = ?, updated_at = NOW() 
       WHERE id = 1`,
      [users, listings, sold, rating]
    );
    
    await connection.end();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating site stats:", error);
    return NextResponse.json(
      { error: "Failed to update site stats" },
      { status: 500 }
    );
  }
}
