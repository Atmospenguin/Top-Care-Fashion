import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSupabaseServer } from "@/lib/supabase";
import { Gender, UserRole, UserStatus } from "@prisma/client";

function mapRole(value: UserRole | null | undefined): "User" | "Admin" {
  return value === UserRole.ADMIN ? "Admin" : "User";
}

function mapStatus(value: UserStatus | null | undefined): "active" | "suspended" {
  return value === UserStatus.SUSPENDED ? "suspended" : "active";
}

function mapGender(value: Gender | null | undefined): "Male" | "Female" | null {
  if (value === Gender.MALE) return "Male";
  if (value === Gender.FEMALE) return "Female";
  return null;
}

function toUserResponse(user: {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  is_premium: boolean;
  premium_until: Date | null;
  dob: Date | null;
  gender: Gender | null;
  avatar_url?: string | null; // ✅ 添加头像字段
}) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: mapRole(user.role),
    status: mapStatus(user.status),
    isPremium: Boolean(user.is_premium),
    premiumUntil: user.premium_until ?? null,
    dob: user.dob ? user.dob.toISOString().slice(0, 10) : null,
    gender: mapGender(user.gender),
    avatar: user.avatar_url ?? null, // ✅ 统一成前端使用的 avatar
  };
}

export async function GET() {
  const supabase = await createSupabaseServer();
  const {
    data: { user: sUser },
  } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const sid = cookieStore.get("tc_session")?.value;

  if (sUser?.id) {
    const user = await prisma.users.findUnique({
      where: { supabase_user_id: sUser.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        is_premium: true,
        premium_until: true,
        dob: true,
        gender: true,
        avatar_url: true, // ✅ 添加头像字段
      },
    });

    if (user) {
      return NextResponse.json({ user: toUserResponse(user), source: "supabase" });
    }
  }

  if (sid) {
    const numericId = Number(sid);
    if (!Number.isNaN(numericId)) {
      const user = await prisma.users.findUnique({
        where: { id: numericId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          is_premium: true,
          premium_until: true,
          dob: true,
          gender: true,
          avatar_url: true, // ✅ 添加头像字段
        },
      });

      if (user) {
        return NextResponse.json({ user: toUserResponse(user), source: "legacy-cookie" });
      }
    }
  }

  return NextResponse.json({ user: null });
}
