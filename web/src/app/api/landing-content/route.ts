import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";

export async function GET() {
  try {
    const connection = await getConnection();
    
    const [content] = await connection.execute(
      `SELECT hero_title, hero_subtitle,
              hero_carousel_images,
              mixmatch_title, mixmatch_desc, mixmatch_girl_images, mixmatch_boy_images,
              ailisting_title, ailisting_desc, ailisting_images,
              search_title, search_desc, search_images
         FROM landing_content WHERE id = 1`
    );
    
    await connection.end();
    
    if (!content || (content as any[]).length === 0) {
      return NextResponse.json({
        heroTitle: 'Discover outfits powered by AI',
        heroSubtitle: 'Mix & Match is an AI outfit recommender that builds looks from listed items. Snap, list, and get smart suggestions instantly.',
        heroCarouselImages: [
          '/TOPApp/Cart.png',
          '/TOPApp/Listing%20Detail.png',
          '/TOPApp/Mix%20%26%20Match.png',
          '/TOPApp/Search%20Result.png'
        ],
        aiFeatures: {
          mixmatch: {
            title: 'Mix & Match',
            desc: 'AI outfit recommendations from your listed items.',
            girlImages: [
              '/TOPApp/mixnmatch1/Mix%20%26%20Match.png',
              '/TOPApp/mixnmatch1/Mix%20%26%20Match-1.png',
              '/TOPApp/mixnmatch1/Mix%20%26%20Match-2.png',
              '/TOPApp/mixnmatch1/Mix%20%26%20Match-3.png'
            ],
            boyImages: [
              '/TOPApp/mixnmatch2/Mix%20%26%20Match.png',
              '/TOPApp/mixnmatch2/Mix%20%26%20Match-1.png',
              '/TOPApp/mixnmatch2/Mix%20%26%20Match-2.png',
              '/TOPApp/mixnmatch2/Mix%20%26%20Match-3.png'
            ]
          },
          ailisting: {
            title: 'AI Listing',
            desc: 'Auto-generate titles, tags and descriptions from photos.',
            images: ['/TOPApp/AI-Listing.png']
          },
          search: {
            title: 'Search',
            desc: 'Natural language and image-based search to find pieces fast.',
            images: ['/TOPApp/Search%20Result.png']
          }
        }
      });
    }
    
    const landingContent = (content as any[])[0] as any;
    const parseMaybeJsonArray = (v: unknown): string[] | null => {
      if (!v) return null;
      if (Array.isArray(v)) return v as string[];
      if (typeof v === 'string') {
        try { const arr = JSON.parse(v); return Array.isArray(arr) ? arr : null; } catch { return null; }
      }
      return null;
    };

    return NextResponse.json({
      heroTitle: landingContent.hero_title,
      heroSubtitle: landingContent.hero_subtitle,
      heroCarouselImages: parseMaybeJsonArray(landingContent.hero_carousel_images),
      aiFeatures: {
        mixmatch: {
          title: landingContent.mixmatch_title ?? 'Mix & Match',
          desc: landingContent.mixmatch_desc ?? 'AI outfit recommendations from your listed items.',
          girlImages: parseMaybeJsonArray(landingContent.mixmatch_girl_images),
          boyImages: parseMaybeJsonArray(landingContent.mixmatch_boy_images),
        },
        ailisting: {
          title: landingContent.ailisting_title ?? 'AI Listing',
          desc: landingContent.ailisting_desc ?? 'Auto-generate titles, tags and descriptions from photos.',
          images: parseMaybeJsonArray(landingContent.ailisting_images),
        },
        search: {
          title: landingContent.search_title ?? 'Search',
          desc: landingContent.search_desc ?? 'Natural language and image-based search to find pieces fast.',
          images: parseMaybeJsonArray(landingContent.search_images),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching landing content:", error);
    return NextResponse.json(
      { error: "Failed to fetch landing content" },
      { status: 500 }
    );
  }
}
