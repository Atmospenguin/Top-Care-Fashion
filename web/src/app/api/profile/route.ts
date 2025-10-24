import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSupabaseServer } from "@/lib/supabase";
import { verifyLegacyToken } from "@/lib/jwt";

type FollowInfo = { id: number };

type UserProfile = {
  id: number;
  username: string | null;
  email: string | null;
  phone_number: string | null;
  bio: string | null;
  location: string | null;
  dob: Date | null;
  gender: string | null;
  avatar_url: string | null;
  preferred_styles: unknown;
  preferred_size_top: string | null;
  preferred_size_bottom: string | null;
  preferred_size_shoe: string | null;
  followers: FollowInfo[];
  following: FollowInfo[];
};

const normalizePreferredStyles = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }
  if (value) {
    return value as unknown[];
  }
  return [];
};

const mapGender = (value: string | null) => {
  if (value === "MALE") return "Male";
  if (value === "FEMALE") return "Female";
  return null;
};

const formatUserResponse = (user: UserProfile) => ({
  id: user.id.toString(),
  username: user.username,
  email: user.email,
  phone: user.phone_number,
  bio: user.bio,
  location: user.location,
  dob: user.dob ? user.dob.toISOString().slice(0, 10) : null,
  gender: mapGender(user.gender),
  avatar_url: user.avatar_url,
  followersCount: user.followers.length,
  followingCount: user.following.length,
  preferred_styles: normalizePreferredStyles(user.preferred_styles),
  preferred_size_top: user.preferred_size_top,
  preferred_size_bottom: user.preferred_size_bottom,
  preferred_size_shoe: user.preferred_size_shoe,
});

async function getCurrentUser(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return null;
    }

    const legacy = verifyLegacyToken(token);
    if (legacy.valid && legacy.payload?.uid) {
      const legacyUser = await prisma.users.findUnique({
        where: { id: Number(legacy.payload.uid) },
      });
      if (legacyUser) {
        return legacyUser;
      }
    }

    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (!error && user) {
      return prisma.users.findUnique({ where: { supabase_user_id: user.id } });
    }

    return null;
  } catch (err) {
    console.error("❌ getCurrentUser failed:", err);
    return null;
  }
}

const selectUserProfile = {
  id: true,
  username: true,
  email: true,
  phone_number: true,
  bio: true,
  location: true,
  dob: true,
  gender: true,
  avatar_url: true,
  preferred_styles: true,
  preferred_size_top: true,
  preferred_size_bottom: true,
  preferred_size_shoe: true,
  followers: {
    select: {
      id: true,
    },
  },
  following: {
    select: {
      id: true,
    },
  },
} satisfies Record<string, unknown>;

/**
 * 获取用户资料
 */
export async function GET(req: NextRequest) {
  const dbUser = await getCurrentUser(req);
  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("📖 Loading profile for user:", dbUser.id);

  const userWithFollows = await prisma.users.findUnique({
    where: { id: dbUser.id },
    select: selectUserProfile,
  });

  if (!userWithFollows) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    user: formatUserResponse(userWithFollows as UserProfile),
  });
}

/**
 * 更新用户资料
 */
export async function PATCH(req: NextRequest) {
  try {
    const dbUser = await getCurrentUser(req);
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    console.log("📝 Profile update request data:", JSON.stringify(data, null, 2));
    console.log("📝 Current user ID:", dbUser.id);

    const updateData: Record<string, unknown> = {};

    if (data.username !== undefined && data.username !== null) {
      updateData.username = data.username;
    }
    if (data.email !== undefined && data.email !== null) {
      updateData.email = data.email;
    }
    if (data.phone !== undefined && data.phone !== null) {
      updateData.phone_number = data.phone;
    }
    if (data.bio !== undefined && data.bio !== null) {
      updateData.bio = data.bio;
    }
    if (data.location !== undefined && data.location !== null) {
      updateData.location = data.location;
    }
    if (data.dob !== undefined && data.dob !== null) {
      updateData.dob = new Date(data.dob);
    }
    if (data.gender !== undefined && data.gender !== null) {
      if (data.gender === "Male") {
        updateData.gender = "MALE";
      } else if (data.gender === "Female") {
        updateData.gender = "FEMALE";
      } else {
        updateData.gender = null;
      }
    }
    if (data.avatar_url !== undefined && data.avatar_url !== null) {
      updateData.avatar_url = data.avatar_url;
    }

    if (data.preferredStyles !== undefined) {
      if (Array.isArray(data.preferredStyles)) {
        updateData.preferred_styles = data.preferredStyles;
      } else if (data.preferredStyles === null) {
        updateData.preferred_styles = null;
      }
    }

    if (data.preferredSizes !== undefined && data.preferredSizes !== null) {
      const sizes = data.preferredSizes as Record<string, unknown>;
      if (Object.prototype.hasOwnProperty.call(sizes, "top")) {
        updateData.preferred_size_top = sizes.top ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(sizes, "bottom")) {
        updateData.preferred_size_bottom = sizes.bottom ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(sizes, "shoe")) {
        updateData.preferred_size_shoe = sizes.shoe ?? null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      console.log("📝 No fields to update, returning current user data");
      const current = await prisma.users.findUnique({
        where: { id: dbUser.id },
        select: selectUserProfile,
      });

      if (!current) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({
        ok: true,
        user: formatUserResponse(current as UserProfile),
      });
    }

    const updated = await prisma.users.update({
      where: { id: dbUser.id },
      data: updateData,
      select: selectUserProfile,
    });

    console.log("✅ Profile updated successfully");

    return NextResponse.json({
      ok: true,
      user: formatUserResponse(updated as UserProfile),
    });
  } catch (err) {
    console.error("❌ Update profile failed:", err);
    return NextResponse.json(
      {
        error: "Update failed",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
