import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const conn = await getConnection();
  const [rows]: any = await conn.execute(
    "SELECT id, username, email, status, role, is_premium, premium_until, created_at AS createdAt FROM users WHERE id = ?",
    [params.id]
  );
  await conn.end();
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  
  try {
    const body = await req.json().catch(() => ({}));
    const { username, email, role, status, is_premium } = body;

    // If only status is provided (for quick toggle), handle it
    if (status && Object.keys(body).length === 1) {
      if (status !== "active" && status !== "suspended") {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      const conn = await getConnection();
      await conn.execute("UPDATE users SET status = ? WHERE id = ?", [status, params.id]);
      const [rows]: any = await conn.execute(
        "SELECT id, username, email, status, role, is_premium, premium_until, created_at AS createdAt FROM users WHERE id = ?",
        [params.id]
      );
      await conn.end();
      if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(rows[0]);
    }

    // For full user update
    const conn = await getConnection();
    const updateFields = [];
    const updateValues = [];

    if (username !== undefined) {
      updateFields.push("username = ?");
      updateValues.push(username);
    }
    if (email !== undefined) {
      updateFields.push("email = ?");
      updateValues.push(email);
    }
    if (role !== undefined) {
      updateFields.push("role = ?");
      updateValues.push(role);
    }
    if (status !== undefined) {
      updateFields.push("status = ?");
      updateValues.push(status);
    }
    if (is_premium !== undefined) {
      updateFields.push("is_premium = ?");
      updateValues.push(is_premium);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updateValues.push(params.id);
    await conn.execute(`UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`, updateValues);

    const [rows]: any = await conn.execute(
      "SELECT id, username, email, status, role, is_premium, premium_until, created_at AS createdAt FROM users WHERE id = ?",
      [params.id]
    );
    await conn.end();
    
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
