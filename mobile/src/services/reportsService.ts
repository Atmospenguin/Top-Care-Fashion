import { apiClient } from "./api";
import { API_CONFIG, ApiError } from "../config/api";

export type ReportTargetType = "listing" | "user";

export interface SubmitReportParams {
  targetType: ReportTargetType;
  targetId: string;
  category?: string;
  details?: string;
  reportedUsername?: string;
  reportedListingId?: string | number;
}

export interface SubmitReportResponse {
  success: boolean;
  report: {
    id: string;
    targetType: ReportTargetType;
    targetId: string;
    reporter: string;
    reason: string;
    status: "open" | "resolved" | "dismissed";
    createdAt: string;
  };
}

export interface UserReportSummary {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
  notes?: string | null;
  resolvedAt?: string | null;
}

class ReportsService {
  private normalizeReport(raw: any): UserReportSummary | null {
    if (!raw || typeof raw !== "object") {
      return null;
    }

    const idValue = (raw as { id?: unknown }).id;
    const id =
      typeof idValue === "number"
        ? String(idValue)
        : typeof idValue === "string" && idValue.trim().length > 0
        ? idValue.trim()
        : undefined;

    if (!id) {
      return null;
    }

    const targetTypeRaw =
      (raw as { targetType?: unknown }).targetType ??
      (raw as { target_type?: unknown }).target_type;

    const normalizedTargetType: ReportTargetType =
      typeof targetTypeRaw === "string" && targetTypeRaw.trim().toLowerCase() === "listing"
        ? "listing"
        : "user";

    const targetIdRaw =
      (raw as { targetId?: unknown }).targetId ??
      (raw as { target_id?: unknown }).target_id;

    const targetId =
      typeof targetIdRaw === "number"
        ? String(targetIdRaw)
        : typeof targetIdRaw === "string" && targetIdRaw.trim().length > 0
        ? targetIdRaw.trim()
        : "";

    const reasonRaw =
      (raw as { reason?: unknown }).reason ?? (raw as { description?: unknown }).description;
    const reason =
      typeof reasonRaw === "string" && reasonRaw.trim().length > 0 ? reasonRaw.trim() : "";

    const statusRaw = (raw as { status?: unknown }).status;
    const statusNormalized =
      typeof statusRaw === "string" ? statusRaw.trim().toLowerCase() : "";

    const status: UserReportSummary["status"] =
      statusNormalized === "resolved"
        ? "resolved"
        : statusNormalized === "dismissed"
        ? "dismissed"
        : "open";

    const createdAtRaw =
      (raw as { createdAt?: unknown }).createdAt ??
      (raw as { created_at?: unknown }).created_at;
    const createdAt =
      typeof createdAtRaw === "string" && createdAtRaw.trim().length > 0
        ? createdAtRaw
        : createdAtRaw instanceof Date
        ? createdAtRaw.toISOString()
        : new Date().toISOString();

    const resolvedAtRaw =
      (raw as { resolvedAt?: unknown }).resolvedAt ??
      (raw as { resolved_at?: unknown }).resolved_at;
    const resolvedAt =
      typeof resolvedAtRaw === "string" && resolvedAtRaw.trim().length > 0
        ? resolvedAtRaw
        : resolvedAtRaw instanceof Date
        ? resolvedAtRaw.toISOString()
        : null;

    const notesRaw = (raw as { notes?: unknown }).notes;
    const notes =
      typeof notesRaw === "string"
        ? notesRaw
        : typeof notesRaw === "number"
        ? String(notesRaw)
        : null;

    return {
      id,
      targetType: normalizedTargetType,
      targetId,
      reason,
      status,
      createdAt,
      resolvedAt,
      notes,
    } satisfies UserReportSummary;
  }

  async getMyReports(): Promise<UserReportSummary[]> {
    try {
      const response = await apiClient.get<{ reports?: unknown }>(
        API_CONFIG.ENDPOINTS.REPORTS,
      );

      const payload = response.data;
      let rawReports: unknown[] = [];

      if (Array.isArray(payload)) {
        rawReports = payload as unknown[];
      } else if (payload && typeof payload === "object") {
        const maybeArray = [
          (payload as { reports?: unknown }).reports,
          (payload as { data?: unknown }).data,
          (payload as { items?: unknown }).items,
        ].find((value): value is unknown[] => Array.isArray(value));

        if (maybeArray) {
          rawReports = maybeArray;
        } else {
          const single = (payload as { report?: unknown }).report;
          if (single && typeof single === "object") {
            rawReports = [single];
          }
        }
      }

      return rawReports
        .map((report) => this.normalizeReport(report))
        .filter((report): report is UserReportSummary => report !== null);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message || "Failed to load reports");
      }
      throw error;
    }
  }

  async submitReport(params: SubmitReportParams): Promise<SubmitReportResponse> {
    const { targetType, targetId, category, details, reportedUsername, reportedListingId } = params;

    if (!targetType) {
      throw new Error("targetType is required");
    }
    if (!targetId) {
      throw new Error("targetId is required");
    }
    if ((!category || !category.trim()) && (!details || !details.trim())) {
      throw new Error("Please provide a report category or details");
    }

    const payload = {
      targetType,
      targetId,
      category: category?.trim() || undefined,
      details: details?.trim() || undefined,
      reportedUsername: reportedUsername?.trim() || undefined,
      reportedListingId: reportedListingId ?? undefined,
    };

    try {
      const response = await apiClient.post<SubmitReportResponse>(
        API_CONFIG.ENDPOINTS.REPORTS,
        payload,
      );

      if (!response.data?.success) {
        const maybeMessage = (response.data as any)?.message;
        throw new Error(
          typeof maybeMessage === "string" ? maybeMessage : "Report submission failed",
        );
      }

      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        const serverMessage =
          (typeof error.response?.error === "string" && error.response.error) ||
          (typeof error.response?.message === "string" && error.response.message);
        throw new Error(serverMessage || error.message || "Report submission failed");
      }
      throw error;
    }
  }
}

export const reportsService = new ReportsService();
