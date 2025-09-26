import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSupabaseServer } from "@/lib/supabase";
import { Gender, Prisma, UserRole, UserStatus } from "@prisma/client";

function mapRole(role: UserRole | null | undefined): "User" | "Admin" {
  return role === UserRole.ADMIN ? "Admin" : "User";
}

function mapStatus(status: UserStatus | null | undefined): "active" | "suspended" {
  return status === UserStatus.SUSPENDED ? "suspended" : "active";
}

function mapGenderOut(value: Gender | null | undefined): "Male" | "Female" | null {
  if (value === Gender.MALE) return "Male";
  if (value === Gender.FEMALE) return "Female";
  return null;
}

function mapGenderIn(value: "Male" | "Female" | null): Gender | null {
  if (!value) return null;
  return value === "Male" ? Gender.MALE : Gender.FEMALE;
}

function extractValidationErrors(error: unknown): string | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = Array.isArray(error.meta?.target)
      ? (error.meta?.target as string[]).join(",")
      : String(error.meta?.target ?? "");
    if (target.includes("email")) return "Email already registered";
    if (target.includes("supabase_user_id")) return "Account already linked";
  }
  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { username, email, password, dob, gender } = body as Record<string, unknown>;

  const normalizedUsername = typeof username === "string" ? username.trim() : "";
  const normalizedEmail = typeof email === "string" ? email.trim() : "";
  const normalizedPassword = typeof password === "string" ? password : "";

  if (!normalizedUsername || !normalizedEmail || !normalizedPassword) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const trimmedDob = typeof dob === "string" ? dob.trim() : "";
  let normalizedDob: string | null = null;
  if (trimmedDob) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDob)) {
      return NextResponse.json({ error: "invalid dob" }, { status: 400 });
    }
    normalizedDob = trimmedDob;
  }

  let normalizedGender: "Male" | "Female" | null = null;
  if (typeof gender === "string" && gender.trim()) {
    const trimmedGender = gender.trim();
    if (trimmedGender !== "Male" && trimmedGender !== "Female") {
      return NextResponse.json({ error: "invalid gender" }, { status: 400 });
    }
    normalizedGender = trimmedGender as "Male" | "Female";
  }

  const supabase = await createSupabaseServer();

  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: normalizedPassword,
      options: {
        data: {
          username: normalizedUsername,
          dob: normalizedDob,
          gender: normalizedGender,
        },
      },
    });

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    const supaUser = signUpData.user;
    if (!supaUser) {
      return NextResponse.json({ error: "Sign up failed" }, { status: 500 });
    }

    const userGender = mapGenderIn(normalizedGender);

    const createdUser = await prisma.users
      .create({
        data: {
          username: normalizedUsername,
          email: normalizedEmail,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          supabase_user_id: supaUser.id,
          dob: normalizedDob ? new Date(normalizedDob) : undefined,
          gender: userGender ?? undefined,
        },
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
        },
      })
      .catch((error: unknown) => {
        const message = extractValidationErrors(error);
        if (message) {
          throw new NextResponse(JSON.stringify({ error: message }), { status: 409 });
        }
        throw error;
      });

    const user = {
      id: createdUser.id,
      username: createdUser.username,
      email: createdUser.email,
      role: mapRole(createdUser.role),
      status: mapStatus(createdUser.status),
      isPremium: Boolean(createdUser.is_premium),
      premiumUntil: createdUser.premium_until ?? null,
      dob: createdUser.dob ? createdUser.dob.toISOString().slice(0, 10) : null,
      gender: mapGenderOut(createdUser.gender),
    };

    return NextResponse.json({ user, requiresConfirmation: !supaUser.email_confirmed_at });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    console.error("Register error:", error);
    const message = error instanceof Error ? error.message : "registration failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
