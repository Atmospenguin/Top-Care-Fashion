import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const conn = await getConnection();
  const categoryId = Number(params.id);
  await conn.execute(
    "UPDATE listing_categories SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?",
    [body.name ?? null, body.description ?? null, categoryId]
  );
  const [rows]: any = await conn.execute(
    "SELECT id, name, description, created_at AS \"createdAt\" FROM listing_categories WHERE id = ?",
    [categoryId]
  );
  await conn.end();
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const row = rows[0];
  return NextResponse.json({
    ...row,
    id: String(row.id),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  });
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  const categoryId = Number(params.id);
  const [res]: any = await conn.execute("DELETE FROM listing_categories WHERE id = ?", [categoryId]);
  await conn.end();
  if (!res.affectedRows) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
