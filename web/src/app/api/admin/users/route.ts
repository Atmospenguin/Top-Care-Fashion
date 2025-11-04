import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Gender, UserRole, UserStatus } from "@prisma/client";

function mapRole(value: UserRole): "User" | "Admin" {
  return value === UserRole.ADMIN ? "Admin" : "User";
}

function mapStatus(value: UserStatus): "active" | "suspended" {
  return value === UserStatus.SUSPENDED ? "suspended" : "active";
}

function mapGender(value: Gender | null): "Male" | "Female" | null {
  if (!value) return null;

  // Handle new enum values
  if (value === "Men" as Gender) return "Male";
  if (value === "Women" as Gender) return "Female";
  if (value === "Unisex" as Gender) return null;

  // Backward compatibility with old enum
  if (value === "MALE" as Gender) return "Male";
  if (value === "FEMALE" as Gender) return "Female";

  return null;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const [dbUsers, totalCount] = await Promise.all([
    prisma.users.findMany({
      skip,
      take: limit,
    select: {
      id: true,
      username: true,
      email: true,
      status: true,
      role: true,
      is_premium: true,
      premium_until: true,
      dob: true,
      gender: true,
      avatar_url: true,
      created_at: true,
    },
      orderBy: {
        created_at: "desc",
      },
    }),
    prisma.users.count(),
  ]);

  const users = dbUsers.map((user) => ({
    id: String(user.id),
    username: user.username,
    email: user.email,
    status: mapStatus(user.status),
    role: mapRole(user.role),
    is_premium: user.is_premium,
    premium_until: user.premium_until?.toISOString() ?? null,
    dob: user.dob?.toISOString().slice(0, 10) ?? null,
    gender: mapGender(user.gender),
    createdAt: user.created_at.toISOString(),
    avatar_url: user.avatar_url ?? null,
  }));

  const totalPages = Math.ceil(totalCount / limit);

  return NextResponse.json({
    users,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
    },
  });
}
