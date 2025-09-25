import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function mapTargetType(value: unknown): "listing" | "user" {
  return String(value ?? "").toUpperCase() === "USER" ? "user" : "listing";
}

function mapStatus(value: unknown): "open" | "resolved" | "dismissed" {
  const normalized = String(value ?? "").toUpperCase();
  if (normalized === "RESOLVED") return "resolved";
  if (normalized === "DISMISSED") return "dismissed";
  return "open";
}

function normalizeStatusIn(value: unknown): "OPEN" | "RESOLVED" | "DISMISSED" {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "RESOLVED") return "RESOLVED";
  if (normalized === "DISMISSED") return "DISMISSED";
  return "OPEN";
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  const [rows]: any = await conn.execute(
    `SELECT r.id, r.target_type AS "targetType", r.target_id AS "targetId",
     r.reporter, u.id AS "reporterId", r.reason, r.status, r.notes,
     r.created_at AS "createdAt", r.resolved_at AS "resolvedAt"
     FROM reports r
     LEFT JOIN users u ON r.reporter = u.username
     ORDER BY r.id DESC`
  );
  await conn.end();
  const reports = (rows as any[]).map((row) => ({
    ...row,
    id: String(row.id),
    targetType: mapTargetType(row.targetType),
    targetId: String(row.targetId),
    status: mapStatus(row.status),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    resolvedAt: row.resolvedAt ? (row.resolvedAt instanceof Date ? row.resolvedAt.toISOString() : String(row.resolvedAt)) : null,
  }));
  return NextResponse.json({ reports });
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
  let setResolvedAt = false;
  if (typeof status === "string") {
    const normalized = normalizeStatusIn(status);
    fields.push("status = ?");
    values.push(normalized);
    if (normalized === "RESOLVED") {
      fields.push("resolved_at = NOW()");
      setResolvedAt = true;
    } else if (normalized === "OPEN") {
      fields.push("resolved_at = NULL");
    }
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
    "SELECT id, target_type AS \"targetType\", target_id AS \"targetId\", reporter, reason, status, notes, created_at AS \"createdAt\", resolved_at AS \"resolvedAt\" FROM reports WHERE id = ?",
    [id]
  );
  await conn.end();
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const row = rows[0];
  const response = {
    ...row,
    id: String(row.id),
    targetType: mapTargetType(row.targetType),
    targetId: String(row.targetId),
    status: mapStatus(row.status),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    resolvedAt: row.resolvedAt ? (row.resolvedAt instanceof Date ? row.resolvedAt.toISOString() : String(row.resolvedAt)) : null,
  };
  if (setResolvedAt && !response.resolvedAt) {
    response.resolvedAt = new Date().toISOString();
  }
  return NextResponse.json(response);
}
