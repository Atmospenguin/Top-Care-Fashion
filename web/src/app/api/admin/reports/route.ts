import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET: list reports; PATCH to update status/notes
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  const [rows] = await conn.execute(
    "SELECT id, target_type AS targetType, target_id AS targetId, reporter, reason, status, notes, created_at AS createdAt, resolved_at AS resolvedAt FROM reports ORDER BY id DESC"
  );
  await conn.end();
  return NextResponse.json({ reports: rows });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { id, status, notes } = body || {};
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const conn = await getConnection();
  const fields: string[] = [];
  const values: any[] = [];
  if (typeof status === "string") {
    fields.push("status = ?");
    values.push(status);
    if (status === "resolved") fields.push("resolved_at = NOW()");
  }
  if (typeof notes === "string") {
    fields.push("notes = ?");
    values.push(notes);
  }
  if (!fields.length) {
    await conn.end();
    return NextResponse.json({ error: "no changes" }, { status: 400 });
  }
  values.push(id);
  await conn.execute(`UPDATE reports SET ${fields.join(", ")} WHERE id = ?`, values);
  const [rows]: any = await conn.execute(
    "SELECT id, target_type AS targetType, target_id AS targetId, reporter, reason, status, notes, created_at AS createdAt, resolved_at AS resolvedAt FROM reports WHERE id = ?",
    [id]
  );
  await conn.end();
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}
