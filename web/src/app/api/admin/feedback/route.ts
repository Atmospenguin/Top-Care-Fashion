import { NextRequest, NextResponse } from "next/server";
import { prisma, parseJson, toNumber } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

type TagList = string[];

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const feedbackList = await prisma.feedback.findMany({
    include: {
      user: {
        select: {
          username: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  const feedbacks = feedbackList.map((feedback) => ({
    id: String(feedback.id),
    userId: feedback.user_id !== null ? String(feedback.user_id) : undefined,
    userEmail: feedback.user_email,
    userName: feedback.user_name,
    message: feedback.message,
    rating: toNumber(feedback.rating),
    tags: parseJson<TagList>(feedback.tags) ?? [],
    featured: feedback.featured,
    createdAt: feedback.created_at.toISOString(),
    associatedUserName: feedback.user?.username,
  }));

  return NextResponse.json({ feedbacks });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { userId, userEmail, userName, message, rating, tags, featured } = body ?? {};

    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    if (featured && !userName) {
      return NextResponse.json({ error: "userName is required for featured feedback" }, { status: 400 });
    }

    await prisma.feedback.create({
      data: {
        user_id: userId ? Number(userId) : null,
        user_email: userEmail || null,
        user_name: userName || null,
        message,
        rating: rating !== undefined && rating !== null ? Number(rating) : null,
        tags: tags ? JSON.stringify(tags) : undefined,
        featured: Boolean(featured),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding feedback:", error);
    return NextResponse.json({ error: "Failed to add feedback" }, { status: 500 });
  }
}
