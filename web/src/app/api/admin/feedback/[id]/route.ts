import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getConnection } from "@/lib/db";

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const conn = await getConnection();
  await conn.execute("DELETE FROM feedback WHERE id = ?", [id]);
  await conn.end();
  return NextResponse.json({ ok: true });
}
