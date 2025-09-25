import { NextResponse } from "next/server";
import { getConnection, toNumber } from "@/lib/db";

export async function GET() {
  try {
    const connection = await getConnection();

    const [rows]: any = await connection.execute(
      `SELECT total_users, total_listings, total_sold, avg_rating
       FROM site_stats
       WHERE id = 1`
    );

    await connection.end();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({
        stats: {
          users: 12000,
          listings: 38000,
          sold: 9400,
          rating: 4.8,
        },
      });
    }

    const siteStats = rows[0];
    return NextResponse.json({
      stats: {
        users: toNumber(siteStats.total_users) ?? 0,
        listings: toNumber(siteStats.total_listings) ?? 0,
        sold: toNumber(siteStats.total_sold) ?? 0,
        rating: toNumber(siteStats.avg_rating) ?? 0,
      },
    });
  } catch (error) {
    console.error("Error fetching site stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch site stats" },
      { status: 500 }
    );
  }
}
