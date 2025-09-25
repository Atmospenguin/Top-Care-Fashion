import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function mapCategory(row: any) {
  return {
    ...row,
    id: String(row.id),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  const [rows]: any = await conn.execute(
    "SELECT id, name, description, created_at AS \"createdAt\" FROM listing_categories ORDER BY id"
  );
  await conn.end();
  const categories = (rows as any[]).map(mapCategory);
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const conn = await getConnection();
  const [res]: any = await conn.execute(
    "INSERT INTO listing_categories (name, description) VALUES (?, ?)",
    [body.name, body.description ?? null]
  );
  const [rows]: any = await conn.execute(
    "SELECT id, name, description, created_at AS \"createdAt\" FROM listing_categories WHERE id = ?",
    [res.insertId]
  );
  await conn.end();
  return NextResponse.json(mapCategory(rows[0]), { status: 201 });
}
