import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import Header from "../../../components/Header";
import { reportsService } from "../../../src/services";
import type { UserReportSummary } from "../../../src/services";
import { useAuth } from "../../../contexts/AuthContext";

type StatusKey = UserReportSummary["status"];

const STATUS_META: Record<StatusKey, { label: string; tint: string; background: string }> = {
  open: {
    label: "In review",
    tint: "#FF4D4F",
    background: "#FFECEC",
  },
  resolved: {
    label: "Resolved",
    tint: "#2E7D32",
    background: "#E7F6EC",
  },
  dismissed: {
    label: "Dismissed",
    tint: "#6B7280",
    background: "#F3F4F6",
  },
};

function formatTimestamp(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  try {
    return date.toLocaleString();
  } catch {
    return date.toISOString();
  }
}

export default function ReportScreen() {
  const { user } = useAuth();
  const [reports, setReports] = useState<UserReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;

      if (!user?.id) {
        setLoading(false);
        setRefreshing(false);
        setReports([]);
        setError("Sign in to track the progress of your reports.");
        return;
      }

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const results = await reportsService.getMyReports();
        const sorted = [...results].sort((a, b) => {
          const timeA = Date.parse(a.createdAt);
          const timeB = Date.parse(b.createdAt);
          const safeA = Number.isNaN(timeA) ? 0 : timeA;
          const safeB = Number.isNaN(timeB) ? 0 : timeB;
          return safeB - safeA;
        });
        setReports(sorted);
      } catch (err) {
        console.error("Error loading report progress:", err);
        const message =
          err instanceof Error && err.message
            ? err.message
            : "Unable to load your reports right now.";
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id],
  );

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [fetchReports]),
  );

  const handleRefresh = useCallback(() => {
    fetchReports({ silent: true });
  }, [fetchReports]);

  const handleRetry = useCallback(() => {
    fetchReports();
  }, [fetchReports]);

  const showEmptyState = useMemo(
    () => !loading && !refreshing && !error && reports.length === 0,
    [loading, refreshing, error, reports],
  );

  return (
    <View style={styles.screen}>
      <Header title="My Reports" showBack />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF4D4F"
            colors={["#FF4D4F"]}
          />
        }
      >
        <Text style={styles.subtitle}>
          Track the reports you've submitted and see when our support team takes action.
        </Text>
        <Text style={styles.sectionTitle}>Status updates</Text>

        {loading && !refreshing ? (
          <View style={styles.loader}>
            <ActivityIndicator color="#FF4D4F" />
            <Text style={styles.loaderText}>Loading your reports…</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Unable to load updates</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && reports.length > 0
          ? reports.map((report) => {
              const statusMeta = STATUS_META[report.status] ?? STATUS_META.open;
              const openedAt = formatTimestamp(report.createdAt);
              const updatedAt =
                report.status !== "open" ? formatTimestamp(report.resolvedAt) : null;
              const targetLabel =
                report.targetType === "listing" ? "Listing" : "User";

              return (
                <View key={report.id} style={styles.reportCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.reportTitle} numberOfLines={2}>
                      {report.reason || "Report submitted"}
                    </Text>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: statusMeta.background },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: statusMeta.tint }]}>
                        {statusMeta.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.reportId}>Case #{report.id}</Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Target</Text>
                    <Text style={styles.metaValue} numberOfLines={1}>
                      {targetLabel}
                      {report.targetId ? ` • ${report.targetId}` : ""}
                    </Text>
                  </View>

                  {openedAt ? (
                    <Text style={styles.timestamp}>Opened {openedAt}</Text>
                  ) : null}

                  {updatedAt ? (
                    <Text style={styles.timestamp}>Last updated {updatedAt}</Text>
                  ) : null}

                  {report.notes ? (
                    <>
                      <View style={styles.divider} />
                      <Text style={styles.notesLabel}>Latest update</Text>
                      <Text style={styles.notesText}>{report.notes}</Text>
                    </>
                  ) : null}
                </View>
              );
            })
          : null}

        {showEmptyState ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No reports yet</Text>
            <Text style={styles.emptyMessage}>
              When you submit a report, you'll see each step of the review process here.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    rowGap: 20,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: "#555",
  },
  sectionTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  loader: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
  loaderText: {
    marginTop: 12,
    fontSize: 13,
    color: "#777",
  },
  errorBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#F4C7C7",
    backgroundColor: "#FFF5F5",
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#A12B2B",
  },
  errorMessage: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: "#A12B2B",
  },
  retryButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#A12B2B",
  },
  retryText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  reportCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5E5",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  reportTitle: {
    flex: 1,
    marginRight: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  reportId: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "500",
    color: "#888",
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  metaRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
    marginRight: 6,
  },
  metaValue: {
    fontSize: 13,
    color: "#333",
    flexShrink: 1,
  },
  timestamp: {
    marginTop: 6,
    fontSize: 12,
    color: "#666",
  },
  divider: {
    marginTop: 16,
    marginBottom: 12,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#EEE",
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#333",
  },
  emptyState: {
    marginTop: 40,
    padding: 24,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E8E8E8",
    backgroundColor: "#FAFAFA",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  emptyMessage: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#666",
    textAlign: "center",
  },
});
