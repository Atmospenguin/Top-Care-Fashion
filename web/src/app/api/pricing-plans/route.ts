import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";

export async function GET() {
  try {
    const connection = await getConnection();
    
    const [plans] = await connection.execute(
      `SELECT plan_type, name, description, price_monthly, price_quarterly, price_annual,
              listing_limit, promotion_price, promotion_discount, commission_rate,
              mixmatch_limit, free_promotion_credits, seller_badge, features, is_popular
       FROM pricing_plans 
       WHERE active = 1 
       ORDER BY price_monthly ASC`
    );
    
    await connection.end();
    
    // Format data for frontend
    const formattedPlans = (plans as any[]).map(plan => ({
      type: plan.plan_type,
      name: plan.name,
      description: plan.description,
      pricing: {
        monthly: plan.price_monthly,
        quarterly: plan.price_quarterly,
        annual: plan.price_annual
      },
      listingLimit: plan.listing_limit,
      promotionPrice: plan.promotion_price,
      promotionDiscount: plan.promotion_discount,
      commissionRate: plan.commission_rate,
      mixMatchLimit: plan.mixmatch_limit,
      freePromotionCredits: plan.free_promotion_credits,
      sellerBadge: plan.seller_badge,
      features: plan.features ? JSON.parse(plan.features) : [],
      isPopular: plan.is_popular === 1
    }));
    
    return NextResponse.json({ plans: formattedPlans });
  } catch (error) {
    console.error("Error fetching pricing plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing plans" },
      { status: 500 }
    );
  }
}
