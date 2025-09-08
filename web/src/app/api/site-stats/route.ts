import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";

export async function GET() {
  try {
    const connection = await getConnection();
    
    const [stats] = await connection.execute(
      `SELECT total_downloads, total_listings, total_sold, avg_rating 
       FROM site_stats 
       WHERE id = 1`
    );
    
    await connection.end();
    
    if (!stats || (stats as any[]).length === 0) {
      return NextResponse.json({
        stats: {
          downloads: 12000,
          listings: 38000,
          sold: 9400,
          rating: 4.8
        }
      });
    }
    
    const siteStats = (stats as any[])[0];
    return NextResponse.json({
      stats: {
        downloads: siteStats.total_downloads,
        listings: siteStats.total_listings,
        sold: siteStats.total_sold,
        rating: siteStats.avg_rating
      }
    });
  } catch (error) {
    console.error("Error fetching site stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch site stats" },
      { status: 500 }
    );
  }
}
