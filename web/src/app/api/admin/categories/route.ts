import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  const [rows] = await conn.execute(
    "SELECT id, name, description, created_at AS createdAt FROM product_categories ORDER BY id"
  );
  await conn.end();
  return NextResponse.json({ categories: rows });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const conn = await getConnection();
  const [res]: any = await conn.execute(
    "INSERT INTO product_categories (name, description) VALUES (?, ?)",
    [body.name, body.description ?? null]
  );
  const [rows]: any = await conn.execute(
    "SELECT id, name, description, created_at AS createdAt FROM product_categories WHERE id = ?",
    [res.insertId]
  );
  await conn.end();
  return NextResponse.json(rows[0], { status: 201 });
}
