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

class ReportsService {
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
