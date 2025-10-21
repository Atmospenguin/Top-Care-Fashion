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

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updates: string[] = [];
  const values: any[] = [];

  if ("userId" in body) {
    const userId = body.userId;
    updates.push("user_id = ?");
    if (userId === null || userId === undefined || userId === "") {
      values.push(null);
    } else {
      const parsed = Number(userId);
      if (!Number.isFinite(parsed)) {
        return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
      }
      values.push(parsed);
    }
  }

  if ("userEmail" in body) {
    updates.push("user_email = ?");
    const email = body.userEmail;
    values.push(email === null || email === undefined || email === "" ? null : String(email));
  }

  if ("userName" in body) {
    updates.push("user_name = ?");
    const name = body.userName;
    values.push(name === null || name === undefined || name === "" ? null : String(name));
  }

  if ("message" in body) {
    updates.push("message = ?");
    const message = body.message;
    values.push(message === null || message === undefined ? null : String(message));
  }

  if ("rating" in body) {
    updates.push("rating = ?");
    const rating = body.rating;
    if (rating === null || rating === undefined || rating === "") {
      values.push(null);
    } else {
      const parsed = Number(rating);
      if (!Number.isFinite(parsed)) {
        return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
      }
      values.push(parsed);
    }
  }

  if ("tags" in body) {
    updates.push("tags = ?");
    const tags = Array.isArray(body.tags) ? body.tags : null;
    values.push(tags ? JSON.stringify(tags) : null);
  }

  if ("featured" in body) {
    updates.push("featured = ?");
    values.push(Boolean(body.featured));
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  const conn = await getConnection();
  try {
    await conn.execute(
      `UPDATE feedback SET ${updates.join(", ")} WHERE id = ?`,
      [...values, id]
    );
  } finally {
    await conn.end();
  }

  return NextResponse.json({ ok: true });
}
