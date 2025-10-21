import { cookies } from "next/headers";
import { getConnection } from "@/lib/db";
import { createSupabaseServer } from "@/lib/supabase";

export type SessionUser = {
  id: number;
  username: string;
  email: string;
  role: "User" | "Admin";
  status: "active" | "suspended";
  isPremium?: number | boolean;
  dob?: string | null;
  gender?: "Male" | "Female" | null;
};

function mapRole(value: unknown): "User" | "Admin" {
  const normalized = String(value ?? "").toUpperCase();
  return normalized === "ADMIN" ? "Admin" : "User";
}

function mapStatus(value: unknown): "active" | "suspended" {
  const normalized = String(value ?? "").toUpperCase();
  return normalized === "SUSPENDED" ? "suspended" : "active";
}

function mapGender(value: unknown): "Male" | "Female" | null {
  const normalized = String(value ?? "").toUpperCase();
  if (!normalized) return null;
  if (normalized === "MALE") return "Male";
  if (normalized === "FEMALE") return "Female";
  return null;
}

export async function getSessionUser(req?: Request): Promise<SessionUser | null> {
  const store = await cookies();
  
  // 首先尝试 Supabase 认证
  try {
    const supabase = await createSupabaseServer();
    
    // 如果有 Request 对象，尝试从 Authorization header 获取 token
    if (req) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
          if (supabaseUser && !error) {
            return await findUserBySupabaseId(supabaseUser.id);
          }
        } catch (error) {
          console.log("Bearer token auth failed:", error);
        }
      }
    }
    
    // 回退到 cookie 认证
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    
    if (supabaseUser) {
      // 通过 Supabase user ID 查找本地用户
      const conn = await getConnection();
      try {
        const [rows]: any = await conn.execute(
          "SELECT id, username, email, role, status, is_premium AS isPremium, dob, gender FROM users WHERE supabase_user_id = ?",
          [supabaseUser.id]
        );
        
        if (rows.length) {
          const row: any = rows[0];
          const dobVal = row.dob;
          const user: SessionUser = {
            id: Number(row.id),
            username: row.username,
            email: row.email,
            role: mapRole(row.role),
            status: mapStatus(row.status),
            isPremium:
              typeof row.isPremium === "boolean"
                ? row.isPremium
                : Number(row.isPremium ?? 0),
            dob: dobVal
              ? (dobVal instanceof Date ? dobVal.toISOString().slice(0, 10) : String(dobVal))
              : null,
            gender: mapGender(row.gender),
          };
          return user;
        }
      } finally {
        await conn.end();
      }
    }
  } catch (error) {
    console.log("Supabase auth check failed:", error);
  }
  
  // 回退到 legacy cookie 认证
  const sid = store.get("tc_session")?.value;
  if (!sid) return null;
  
  const conn = await getConnection();
  try {
    const [rows]: any = await conn.execute(
      "SELECT id, username, email, role, status, is_premium AS isPremium, dob, gender FROM users WHERE id = ?",
      [Number(sid)]
    );
    if (!rows.length) return null;
    const row: any = rows[0];
    const dobVal = row.dob;
    const user: SessionUser = {
      id: Number(row.id),
      username: row.username,
      email: row.email,
      role: mapRole(row.role),
      status: mapStatus(row.status),
      isPremium:
        typeof row.isPremium === "boolean"
          ? row.isPremium
          : Number(row.isPremium ?? 0),
      dob: dobVal
        ? (dobVal instanceof Date ? dobVal.toISOString().slice(0, 10) : String(dobVal))
        : null,
      gender: mapGender(row.gender),
    };
    return user;
  } finally {
    await conn.end();
  }
}

async function findUserBySupabaseId(supabaseUserId: string): Promise<SessionUser | null> {
  const conn = await getConnection();
  try {
    const [rows]: any = await conn.execute(
      "SELECT id, username, email, role, status, is_premium AS isPremium, dob, gender FROM users WHERE supabase_user_id = ?",
      [supabaseUserId]
    );

    if (rows.length) {
      const row: any = rows[0];
      const dobVal = row.dob;
      const user: SessionUser = {
        id: Number(row.id),
        username: row.username,
        email: row.email,
        role: mapRole(row.role),
        status: mapStatus(row.status),
        isPremium:
          typeof row.isPremium === "boolean"
            ? row.isPremium
            : Number(row.isPremium ?? 0),
        dob: dobVal
          ? (dobVal instanceof Date ? dobVal.toISOString().slice(0, 10) : String(dobVal))
          : null,
        gender: mapGender(row.gender),
      };
      return user;
    }
  } finally {
    await conn.end();
  }
  return null;
}

export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || user.role !== "Admin") return null;
  return user;
}
