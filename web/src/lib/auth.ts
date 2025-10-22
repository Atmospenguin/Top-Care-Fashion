import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
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
      console.log("🔍 Auth header:", authHeader);
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        console.log("🔍 Bearer token:", token.substring(0, 20) + "...");
        try {
          const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
          console.log("🔍 Supabase user:", supabaseUser?.id);
          console.log("🔍 Supabase error:", error);
          if (supabaseUser && !error) {
            const dbUser = await findUserBySupabaseId(supabaseUser.id);
            console.log("🔍 DB user found:", dbUser?.username);
            return dbUser;
          }
        } catch (error) {
          console.log("❌ Bearer token auth failed:", error);
        }
      }
    }
    
    // 回退到 cookie 认证
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    
    if (supabaseUser) {
      // 通过 Supabase user ID 查找本地用户
      try {
        const user = await prisma.users.findUnique({
          where: { supabase_user_id: supabaseUser.id },
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            status: true,
            is_premium: true,
            dob: true,
            gender: true,
          },
        });
        
        if (user) {
          const sessionUser: SessionUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: mapRole(user.role),
            status: mapStatus(user.status),
            isPremium: Boolean(user.is_premium),
            dob: user.dob ? user.dob.toISOString().slice(0, 10) : null,
            gender: mapGender(user.gender),
          };
          return sessionUser;
        }
      } catch (error) {
        console.log("❌ Error finding user by Supabase ID (cookie auth):", error);
      }
    }
  } catch (error) {
    console.log("Supabase auth check failed:", error);
  }
  
  // 回退到 legacy cookie 认证
  const sid = store.get("tc_session")?.value;
  if (!sid) return null;
  
  try {
    const user = await prisma.users.findUnique({
      where: { id: parseInt(sid) },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        is_premium: true,
        dob: true,
        gender: true,
      },
    });
    
    if (user) {
      const sessionUser: SessionUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: mapRole(user.role),
        status: mapStatus(user.status),
        isPremium: Boolean(user.is_premium),
        dob: user.dob ? user.dob.toISOString().slice(0, 10) : null,
        gender: mapGender(user.gender),
      };
      return sessionUser;
    }
  } catch (error) {
    console.log("❌ Error finding user by legacy session:", error);
  }
  
  return null;
}

async function findUserBySupabaseId(supabaseUserId: string): Promise<SessionUser | null> {
  try {
    const user = await prisma.users.findUnique({
      where: { supabase_user_id: supabaseUserId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        is_premium: true,
        dob: true,
        gender: true,
      },
    });

    if (user) {
      const sessionUser: SessionUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: mapRole(user.role),
        status: mapStatus(user.status),
        isPremium: Boolean(user.is_premium),
        dob: user.dob ? user.dob.toISOString().slice(0, 10) : null,
        gender: mapGender(user.gender),
      };
      return sessionUser;
    }
  } catch (error) {
    console.log("❌ Error finding user by Supabase ID:", error);
  }
  return null;
}

export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || user.role !== "Admin") return null;
  return user;
}
