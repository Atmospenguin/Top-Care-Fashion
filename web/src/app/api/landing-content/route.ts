import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";

export async function GET() {
  try {
    const connection = await getConnection();
    
    const [content] = await connection.execute(
      `SELECT hero_title, hero_subtitle FROM landing_content WHERE id = 1`
    );
    
    await connection.end();
    
    if (!content || (content as any[]).length === 0) {
      return NextResponse.json({
        heroTitle: 'Discover outfits powered by AI',
        heroSubtitle: 'Mix & Match is an AI outfit recommender that builds looks from listed items. Snap, list, and get smart suggestions instantly.'
      });
    }
    
    const landingContent = (content as any[])[0];
    return NextResponse.json({
      heroTitle: landingContent.hero_title,
      heroSubtitle: landingContent.hero_subtitle
    });
  } catch (error) {
    console.error("Error fetching landing content:", error);
    return NextResponse.json(
      { error: "Failed to fetch landing content" },
      { status: 500 }
    );
  }
}
