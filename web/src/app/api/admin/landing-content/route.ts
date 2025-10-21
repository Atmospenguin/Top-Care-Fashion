import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { heroTitle, heroSubtitle, heroCarouselImages, aiFeatures } = body as any;
    // Normalize mixmatch images: prefer aiFeatures.mixmatch.images, else merge legacy girl/boy
    const mixmatchImages: string[] | null =
      (aiFeatures?.mixmatch?.images && Array.isArray(aiFeatures.mixmatch.images) && aiFeatures.mixmatch.images.length > 0)
        ? aiFeatures.mixmatch.images
        : (
            ((aiFeatures?.mixmatch?.girlImages || []) as string[]).concat((aiFeatures?.mixmatch?.boyImages || []) as string[])
          ).length > 0
          ? ((aiFeatures?.mixmatch?.girlImages || []) as string[]).concat((aiFeatures?.mixmatch?.boyImages || []) as string[])
          : null;

    const connection = await getConnection();

    // Use UPSERT so that first save creates the row if not existing
    await connection.execute(
      `INSERT INTO landing_content (
         id,
         hero_title, hero_subtitle, hero_carousel_images,
         mixmatch_title, mixmatch_desc, mixmatch_images,
         ailisting_title, ailisting_desc, ailisting_images,
         search_title, search_desc, search_images,
         updated_at
       ) VALUES (
         1,
         ?, ?, CAST(? AS JSONB),
         ?, ?, CAST(? AS JSONB),
         ?, ?, CAST(? AS JSONB),
         ?, ?, CAST(? AS JSONB),
         NOW()
       )
       ON CONFLICT (id) DO UPDATE SET
         hero_title = EXCLUDED.hero_title,
         hero_subtitle = EXCLUDED.hero_subtitle,
         hero_carousel_images = EXCLUDED.hero_carousel_images,
         mixmatch_title = EXCLUDED.mixmatch_title,
         mixmatch_desc = EXCLUDED.mixmatch_desc,
         mixmatch_images = EXCLUDED.mixmatch_images,
         ailisting_title = EXCLUDED.ailisting_title,
         ailisting_desc = EXCLUDED.ailisting_desc,
         ailisting_images = EXCLUDED.ailisting_images,
         search_title = EXCLUDED.search_title,
         search_desc = EXCLUDED.search_desc,
         search_images = EXCLUDED.search_images,
         updated_at = NOW()`,
      [
        heroTitle ?? null,
        heroSubtitle ?? null,
        heroCarouselImages ? JSON.stringify(heroCarouselImages) : null,
        aiFeatures?.mixmatch?.title ?? null,
        aiFeatures?.mixmatch?.desc ?? null,
        mixmatchImages ? JSON.stringify(mixmatchImages) : null,
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
