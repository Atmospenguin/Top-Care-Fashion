import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type FollowListType = "followers" | "following";

const baseUserSelect = {
  id: true,
  username: true,
  avatar_url: true,
  bio: true,
  location: true,
  followers: {
    select: { id: true },
  },
  following: {
    select: { id: true },
  },
} satisfies Record<string, unknown>;

const parseType = (value: string | null): FollowListType =>
  value === "following" ? "following" : "followers";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ username: string }> },
) {
  const params = await context.params;
  const username = params.username;
  const { searchParams } = new URL(req.url);
  const type = parseType(searchParams.get("type"));

  try {
    const user = await prisma.users.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let list;

    if (type === "followers") {
      const relations = await prisma.user_follows.findMany({
        where: { following_id: user.id },
        include: { follower: { select: baseUserSelect } },
        orderBy: { created_at: "desc" },
      });

      list = relations
        .map((relation) => {
          if (!relation.follower) {
            return null;
          }

          return {
            id: relation.follower.id.toString(),
            username: relation.follower.username,
            avatarUrl: relation.follower.avatar_url,
            bio: relation.follower.bio,
            location: relation.follower.location,
            followersCount: relation.follower.followers?.length ?? 0,
            followingCount: relation.follower.following?.length ?? 0,
            followedAt: relation.created_at.toISOString(),
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));
    } else {
      const relations = await prisma.user_follows.findMany({
        where: { follower_id: user.id },
        include: { following: { select: baseUserSelect } },
        orderBy: { created_at: "desc" },
      });

      list = relations
        .map((relation) => {
          if (!relation.following) {
            return null;
          }

          return {
            id: relation.following.id.toString(),
            username: relation.following.username,
            avatarUrl: relation.following.avatar_url,
            bio: relation.following.bio,
            location: relation.following.location,
            followersCount: relation.following.followers?.length ?? 0,
            followingCount: relation.following.following?.length ?? 0,
            followedAt: relation.created_at.toISOString(),
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));
    }

    return NextResponse.json({ success: true, data: list });
  } catch (error) {
    console.error("❌ Failed to fetch follow list for user", username, error);
    return NextResponse.json(
      { error: "Failed to fetch follow list" },
      { status: 500 },
    );
  }
}
