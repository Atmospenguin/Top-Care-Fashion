import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const faqList = await prisma.faq.findMany({
    select: {
      id: true,
      question: true,
      answer: true,
      created_at: true,
      answered_at: true,
    },
    orderBy: {
      id: "desc",
    },
  });

  const faqs = faqList.map((faq) => ({
    id: faq.id,
    question: faq.question,
    answer: faq.answer,
    createdAt: faq.created_at.toISOString(),
    answeredAt: faq.answered_at?.toISOString() ?? null,
  }));

  return NextResponse.json({ faqs });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { id, answer } = body || {};
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const faq = await prisma.faq.update({
      where: { id: Number(id) },
      data: {
        answer: answer ?? null,
        answered_at: new Date(),
      },
      select: {
        id: true,
        question: true,
        answer: true,
        created_at: true,
        answered_at: true,
      },
    });

    return NextResponse.json({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      createdAt: faq.created_at.toISOString(),
      answeredAt: faq.answered_at?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Error updating FAQ:", error);
    return NextResponse.json({ error: "Failed to update FAQ" }, { status: 500 });
  }
}
