import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'top_care_fashion'
};

export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const connection = await mysql.createConnection(dbConfig);

    try {
      // Update pricing plans
      for (const plan of body.plans) {
        await connection.execute(
          `UPDATE pricing_plans SET 
           name = ?, description = ?, 
           monthly_price = ?, quarterly_price = ?, annual_price = ?,
           listing_limit = ?, promotion_price = ?, promotion_discount = ?,
           commission_rate = ?, mixmatch_limit = ?, free_promotion_credits = ?,
           seller_badge = ?, features = ?, is_popular = ?
           WHERE type = ?`,
          [
            plan.name,
            plan.description,
            plan.pricing.monthly,
            plan.pricing.quarterly,
            plan.pricing.annual,
            plan.listingLimit,
            plan.promotionPrice,
            plan.promotionDiscount,
            plan.commissionRate,
            plan.mixMatchLimit,
            plan.freePromotionCredits,
            plan.sellerBadge,
            JSON.stringify(plan.features),
            plan.isPopular,
            plan.type
          ]
        );
      }

      return NextResponse.json({ success: true });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error updating pricing plans:', error);
    return NextResponse.json(
      { error: 'Failed to update pricing plans' },
      { status: 500 }
    );
  }
}
