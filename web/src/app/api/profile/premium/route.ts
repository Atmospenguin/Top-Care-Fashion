import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getConnection, toNumber } from "@/lib/db";

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// Helper to get premium pricing from pricing_plans
async function getPremiumPrice(duration: "1m" | "3m" | "1y"): Promise<number> {
  try {
    const connection = await getConnection();
    const [plans]: any = await connection.execute(
      `SELECT price_monthly, price_quarterly, price_annual
       FROM pricing_plans
       WHERE plan_type = 'PREMIUM' AND active = TRUE
       LIMIT 1`
    );
    await connection.end();

    if (!plans || plans.length === 0) {
      // Default fallback prices
      return duration === "1y" ? 99.99 : duration === "3m" ? 29.99 : 9.99;
    }

    const plan = plans[0];
    if (duration === "1y") return toNumber(plan.price_annual) ?? 99.99;
    if (duration === "3m") return toNumber(plan.price_quarterly) ?? 29.99;
    return toNumber(plan.price_monthly) ?? 9.99;
  } catch (error) {
    console.error("Error fetching premium price:", error);
    // Return default prices on error
    return duration === "1y" ? 99.99 : duration === "3m" ? 29.99 : 9.99;
  }
}

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.users.findUnique({
    where: { id: session.id },
    select: { id: true, is_premium: true, premium_until: true },
  });
  if (!dbUser) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  return NextResponse.json({
    ok: true,
    isPremium: Boolean(dbUser.is_premium),
    premiumUntil: dbUser.premium_until ?? null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const plan: "1m" | "3m" | "1y" = body?.plan ?? "1m";

    const now = new Date();
    const months = plan === "1y" ? 12 : plan === "3m" ? 3 : 1;

    const existing = await prisma.users.findUnique({
      where: { id: session.id },
      select: { premium_until: true },
    });

    const currentExpiry = existing?.premium_until;
    const baseDate = currentExpiry && currentExpiry > now ? currentExpiry : now;
    const until = addMonths(baseDate, months);

    // Get pricing for this plan
    const paidAmount = await getPremiumPrice(plan);

    // Create subscription record
    await prisma.$executeRaw`
      INSERT INTO premium_subscriptions (user_id, plan_duration, paid_amount, started_at, ends_at, status)
      VALUES (${session.id}, ${plan}, ${paidAmount}, ${now}, ${until}, 'ACTIVE')
    `;

    // 注意：如果 Prisma Client 还未根据新列生成类型，以下两个字段在类型层面会报错，运行时是有效的
    // free_promotions_used, free_promotions_reset_at
    const updateData: any = {
      is_premium: true,
      premium_until: until,
      free_promotions_used: 0,
      free_promotions_reset_at: new Date(),
    };

    const updated = await prisma.users.update({
      where: { id: session.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        is_premium: true,
        premium_until: true,
      },
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        role: String(updated.role).toUpperCase() === "ADMIN" ? "Admin" : "User",
        status: String(updated.status).toUpperCase() === "SUSPENDED" ? "suspended" : "active",
        isPremium: Boolean(updated.is_premium),
        premiumUntil: updated.premium_until ?? null,
      },
    });
  } catch (err) {
    console.error("❌ Premium upgrade failed:", err);
    return NextResponse.json({ error: "Upgrade failed" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updated = await prisma.users.update({
    where: { id: session.id },
    data: { is_premium: false, premium_until: null },
    select: { id: true, is_premium: true, premium_until: true },
  });

  return NextResponse.json({
    ok: true,
    isPremium: Boolean(updated.is_premium),
    premiumUntil: updated.premium_until ?? null,
  });
}
