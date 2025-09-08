import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { heroTitle, heroSubtitle } = body;

    const connection = await getConnection();
    
    await connection.execute(
      `UPDATE landing_content SET 
       hero_title = ?, hero_subtitle = ?, updated_at = NOW() 
       WHERE id = 1`,
      [heroTitle, heroSubtitle]
    );
    
    await connection.end();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating landing content:", error);
    return NextResponse.json(
      { error: "Failed to update landing content" },
      { status: 500 }
    );
  }
}
