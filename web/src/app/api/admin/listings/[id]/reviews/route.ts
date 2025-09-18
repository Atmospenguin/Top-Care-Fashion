import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  const [rows] = await conn.execute(
    "SELECT id, listing_id AS listingId, author, author_user_id AS authorUserId, rating, comment, transaction_id AS transactionId, created_at AS createdAt FROM reviews WHERE listing_id = ? ORDER BY id DESC",
    [params.id]
  );
  await conn.end();
  return NextResponse.json({ reviews: rows });
}
