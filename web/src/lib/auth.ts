import { cookies } from "next/headers";
import { getConnection } from "@/lib/db";

export type SessionUser = {
  id: number;
  username: string;
  email: string;
  role: "User" | "Admin";
  status: "active" | "suspended";
  isPremium?: number;
  dob?: string | null;
  gender?: "Male" | "Female" | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const sid = store.get("tc_session")?.value;
  if (!sid) return null;
  const conn = await getConnection();
  try {
    const [rows]: any = await conn.execute(
      "SELECT id, username, email, role, status, is_premium AS isPremium, dob, gender FROM users WHERE id = ?",
      [sid]
    );
    if (!rows.length) return null;
    const row: any = rows[0];
    const dobVal = row.dob;
    const user: SessionUser = {
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      status: row.status,
      isPremium: row.isPremium,
      dob: dobVal
        ? (dobVal instanceof Date ? dobVal.toISOString().slice(0, 10) : String(dobVal))
        : null,
      gender: row.gender ?? null,
    };
    return user;
  } finally {
    await conn.end();
  }
}

export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || user.role !== "Admin") return null;
  return user;
}
