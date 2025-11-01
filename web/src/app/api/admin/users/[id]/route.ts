import { NextRequest, NextResponse } from "next/server";
import { prisma, toNumber } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Gender, UserRole, UserStatus } from "@prisma/client";

type UserResponse = {
  id: string;
  username: string;
  email: string;
  status: "active" | "suspended";
  role: "User" | "Admin";
  is_premium: boolean;
  premium_until: string | null;
  dob: string | null;
  gender: "Male" | "Female" | null;
  average_rating: number | null;
  total_reviews: number;
  createdAt: string;
  avatar_url: string | null;
};

function mapRoleOut(value: UserRole): "User" | "Admin" {
  return value === UserRole.ADMIN ? "Admin" : "User";
}

function mapStatusOut(value: UserStatus): "active" | "suspended" {
  return value === UserStatus.SUSPENDED ? "suspended" : "active";
}

function mapGenderOut(value: Gender | null): "Male" | "Female" | null {
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

function normalizeStatusIn(value: unknown): UserStatus {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "SUSPENDED") return UserStatus.SUSPENDED;
  return UserStatus.ACTIVE;
}

function normalizeRoleIn(value: unknown): UserRole {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "ADMIN") return UserRole.ADMIN;
  return UserRole.USER;
}

function normalizePremium(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    return trimmed === "1" || trimmed === "true";
  }
  return false;
}

function normalizeGenderIn(value: unknown): Gender | null {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;

  // Handle new API format (Male, Female, Unisex)
  if (normalized === "Male") return "Men" as Gender;
  if (normalized === "Female") return "Women" as Gender;
  if (normalized === "Unisex") return "Unisex" as Gender;

  // Backward compatibility with uppercase old enum
  if (normalized.toUpperCase() === "MALE" || normalized.toUpperCase() === "MEN") return "Men" as Gender;
  if (normalized.toUpperCase() === "FEMALE" || normalized.toUpperCase() === "WOMEN") return "Women" as Gender;

  return null;
}

function toIso(value: Date | null): string | null {
  if (!value) return null;
  return value.toISOString();
}

function toDateOnly(value: Date | null): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

function formatUser(user: {
  id: number;
  username: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  is_premium: boolean;
  premium_until: Date | null;
  dob: Date | null;
  gender: Gender | null;
  average_rating: any;
  total_reviews: number;
  created_at: Date;
  avatar_url: string | null;
}): UserResponse {
  return {
    id: String(user.id),
    username: user.username,
    email: user.email,
    status: mapStatusOut(user.status),
    role: mapRoleOut(user.role),
    is_premium: user.is_premium,
    premium_until: toIso(user.premium_until),
    dob: toDateOnly(user.dob),
    gender: mapGenderOut(user.gender),
    average_rating: toNumber(user.average_rating),
    total_reviews: user.total_reviews ?? 0,
    createdAt: toIso(user.created_at) ?? new Date().toISOString(),
    avatar_url: user.avatar_url ?? null,
  };
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await prisma.users.findUnique({
    where: { id: Number(params.id) },
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
      average_rating: true,
      total_reviews: true,
      avatar_url: true,
      created_at: true,
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(formatUser(user));
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json().catch(() => ({}));
    const { username, email, role, status, is_premium, gender } = body ?? {};
    const userId = Number(params.id);

    // Build update data object with only defined fields
    const updateData: {
      username?: string;
      email?: string;
      role?: UserRole;
      status?: UserStatus;
      is_premium?: boolean;
      gender?: Gender | null;
    } = {};

    if (username !== undefined) {
      updateData.username = username;
    }
    if (email !== undefined) {
      updateData.email = email;
    }
    if (role !== undefined) {
      updateData.role = normalizeRoleIn(role);
    }
    if (status !== undefined) {
      updateData.status = normalizeStatusIn(status);
    }
    if (is_premium !== undefined) {
      updateData.is_premium = normalizePremium(is_premium);
    }
    if (gender !== undefined) {
      updateData.gender = normalizeGenderIn(gender);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const user = await prisma.users.update({
      where: { id: userId },
      data: updateData,
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
        average_rating: true,
        total_reviews: true,
        avatar_url: true,
        created_at: true,
      },
    });

    return NextResponse.json(formatUser(user));
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
