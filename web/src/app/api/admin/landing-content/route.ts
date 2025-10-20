import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const {
      heroTitle,
      heroSubtitle,
      heroCarouselImages,
      aiFeatures,
    } = body as any;

    const connection = await getConnection();
    
    await connection.execute(
      `UPDATE landing_content SET 
       hero_title = ?,
       hero_subtitle = ?,
       hero_carousel_images = CAST(? AS JSONB),
       mixmatch_title = ?,
       mixmatch_desc = ?,
       mixmatch_girl_images = CAST(? AS JSONB),
       mixmatch_boy_images = CAST(? AS JSONB),
       ailisting_title = ?,
       ailisting_desc = ?,
       ailisting_images = CAST(? AS JSONB),
       search_title = ?,
       search_desc = ?,
       search_images = CAST(? AS JSONB),
       updated_at = NOW() 
       WHERE id = 1`,
      [
        heroTitle ?? null,
        heroSubtitle ?? null,
        heroCarouselImages ? JSON.stringify(heroCarouselImages) : null,
        aiFeatures?.mixmatch?.title ?? null,
        aiFeatures?.mixmatch?.desc ?? null,
        aiFeatures?.mixmatch?.girlImages ? JSON.stringify(aiFeatures.mixmatch.girlImages) : null,
        aiFeatures?.mixmatch?.boyImages ? JSON.stringify(aiFeatures.mixmatch.boyImages) : null,
        aiFeatures?.ailisting?.title ?? null,
        aiFeatures?.ailisting?.desc ?? null,
        aiFeatures?.ailisting?.images ? JSON.stringify(aiFeatures.ailisting.images) : null,
        aiFeatures?.search?.title ?? null,
        aiFeatures?.search?.desc ?? null,
        aiFeatures?.search?.images ? JSON.stringify(aiFeatures.search.images) : null,
      ]
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
