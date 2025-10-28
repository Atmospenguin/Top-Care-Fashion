import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

type IncomingTargetType = "listing" | "user" | "general" | string;

function normalizeTargetType(value: IncomingTargetType): "LISTING" | "USER" {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "LISTING") return "LISTING";
  if (normalized === "USER") return "USER";
  return "USER";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function buildReason(category?: string, details?: string): string {
  const parts = [];
  if (isNonEmptyString(category)) {
    parts.push(category.trim());
  }
  if (isNonEmptyString(details)) {
    parts.push(details.trim());
  }
  return parts.join(" - ");
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    targetType,
    targetId,
    category,
    details,
    reportedUsername,
    reportedListingId,
  } = payload ?? {};

  const normalizedTargetType = normalizeTargetType(targetType);

  const providedTargetId = isNonEmptyString(targetId)
    ? targetId.trim()
    : normalizedTargetType === "LISTING" && reportedListingId
    ? String(reportedListingId).trim()
    : isNonEmptyString(reportedUsername)
    ? reportedUsername.trim()
    : normalizedTargetType === "USER" && typeof user.id !== "undefined"
    ? String(user.id)
    : null;

  if (!providedTargetId) {
    return NextResponse.json({ error: "Target identifier is required" }, { status: 400 });
  }

  const reason = buildReason(category, details);
  if (!reason) {
    return NextResponse.json(
      { error: "Please include a category or provide report details" },
      { status: 400 },
    );
  }

  try {
    const reporterIdentifier = isNonEmptyString(user.username) ? user.username : user.email;
    const report = await prisma.reports.create({
      data: {
        target_type: normalizedTargetType,
        target_id: providedTargetId,
        reporter: reporterIdentifier ?? "anonymous",
        reason,
        status: "OPEN",
      },
      select: {
        id: true,
        target_type: true,
        target_id: true,
        reporter: true,
        reason: true,
        status: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        report: {
          id: String(report.id),
          targetType: report.target_type === "USER" ? "user" : "listing",
          targetId: String(report.target_id),
          reporter: report.reporter,
          reason: report.reason,
          status: "open",
          createdAt:
            report.created_at instanceof Date
              ? report.created_at.toISOString()
              : String(report.created_at),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create report:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}

