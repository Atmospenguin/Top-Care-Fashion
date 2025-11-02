import { NextResponse } from "next/server";
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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const dbUsers = await prisma.users.findMany({
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
  });

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

  return NextResponse.json({ users });
}
