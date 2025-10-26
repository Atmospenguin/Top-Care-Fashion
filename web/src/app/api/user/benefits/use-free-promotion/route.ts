import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canUseFreePromotion, isPremiumUser, shouldResetFreePromotions } from "@/lib/userPermissions";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await (prisma.users as any).findUnique({
      where: { id: session.id },
      select: {
        id: true,
        is_premium: true,
        premium_until: true,
        free_promotions_used: true,
        free_promotions_reset_at: true,
      } as any,
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isPremium = isPremiumUser(user);
    if (!isPremium) {
      return NextResponse.json({ ok: false, reason: "not_premium" }, { status: 403 });
    }

    let used = (user as any).free_promotions_used ?? 0;
    const lastReset = (user as any).free_promotions_reset_at ?? null;

    // Reset monthly if needed
    if (shouldResetFreePromotions(lastReset)) {
      used = 0;
      await (prisma.users as any).update({
        where: { id: user.id },
        data: { free_promotions_used: 0, free_promotions_reset_at: new Date() },
      });
    }

    const status = canUseFreePromotion(true, used, new Date());
    if (!status.canUse) {
      return NextResponse.json({ ok: false, reason: "quota_exhausted", remaining: 0 }, { status: 403 });
    }

    const updated = await (prisma.users as any).update({
      where: { id: user.id },
      data: { free_promotions_used: used + 1 },
      select: { free_promotions_used: true },
    });

    return NextResponse.json({ ok: true, used: (updated as any).free_promotions_used, remaining: Math.max(0, 3 - ((updated as any).free_promotions_used ?? used + 1)) });
  } catch (err) {
    console.error("❌ Use free promotion failed:", err);
    return NextResponse.json({ error: "Failed to update counter" }, { status: 400 });
  }
}
