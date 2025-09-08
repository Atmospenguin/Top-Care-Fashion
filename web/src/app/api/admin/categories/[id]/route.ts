import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const conn = await getConnection();
  await conn.execute(
    "UPDATE product_categories SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?",
    [body.name ?? null, body.description ?? null, params.id]
  );
  const [rows]: any = await conn.execute(
    "SELECT id, name, description, created_at AS createdAt FROM product_categories WHERE id = ?",
    [params.id]
  );
  await conn.end();
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  const [res]: any = await conn.execute("DELETE FROM product_categories WHERE id = ?", [params.id]);
  await conn.end();
  if (!res.affectedRows) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
