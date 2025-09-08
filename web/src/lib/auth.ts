import { cookies } from "next/headers";
import { getConnection } from "@/lib/db";

export type SessionUser = {
  id: number;
  username: string;
  email: string;
  role: "User" | "Admin";
  status: "active" | "suspended";
  isPremium?: number;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const sid = store.get("tc_session")?.value;
  if (!sid) return null;
  const conn = await getConnection();
  try {
    const [rows]: any = await conn.execute(
      "SELECT id, username, email, role, status, is_premium AS isPremium FROM users WHERE id = ?",
      [sid]
    );
    if (!rows.length) return null;
    return rows[0] as SessionUser;
  } finally {
    await conn.end();
  }
}

export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || user.role !== "Admin") return null;
  return user;
}
