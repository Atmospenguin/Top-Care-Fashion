import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import Icon from "../../../components/Icon";
import PaymentSelector from "../../../components/PaymentSelector";
import type { PremiumStackParamList } from "../PremiumStack";
import {
  benefitsService,
  listingsService,
  type UserBenefitsPayload,
} from "../../../src/services";
import type { PaymentMethod } from "../../../src/services/paymentMethodsService";
import { ApiError } from "../../../src/config/api";

const BOOST_DURATION_DAYS = 3;

export default function BoostCheckoutScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<PremiumStackParamList, "BoostCheckout">>();
  const route = useRoute<RouteProp<PremiumStackParamList, "BoostCheckout">>();
  const { plan, listings, listingIds, benefitsSnapshot } = route.params;

  const [benefits, setBenefits] = useState<UserBenefitsPayload["benefits"] | null>(
    benefitsSnapshot ?? null
  );
  const [benefitsLoading, setBenefitsLoading] = useState(!benefitsSnapshot);
  const [benefitsError, setBenefitsError] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (benefitsSnapshot) {
      return;
    }
    let mounted = true;
    const load = async () => {
      try {
        setBenefitsLoading(true);
        const payload = await benefitsService.getUserBenefits();
        if (!mounted) return;
        setBenefits(payload.benefits);
      } catch (error) {
        console.warn("Failed to refresh benefits for boost checkout", error);
        if (mounted) {
          setBenefitsError(
            "Unable to refresh benefits. Totals may be outdated."
          );
        }
      } finally {
        if (mounted) {
          setBenefitsLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [benefitsSnapshot]);

  const listingNames = useMemo(() => {
    if (listings.length > 0) {
      return listings.map((item) => item.title || `Listing ${item.id}`);
    }
    return listingIds.map((id) => `Listing ${id}`);
  }, [listingIds, listings]);

  const listingCount = useMemo(() => {
    if (listings.length > 0) {
      return listings.length;
    }
    return listingIds.length;
  }, [listingIds, listings]);

  const pricePerBoost = useMemo(() => {
    const defaultPrice = plan === "premium" ? 2.0 : 2.9;
    if (!benefits) {
      return defaultPrice;
    }
    if (plan === "premium") {
      return (
        benefits.promotionPricing?.price ??
        benefits.promotionPrice ??
        defaultPrice
      );
    }
    return benefits.promotionPricing?.regularPrice ?? 2.9;
  }, [benefits, plan]);

  const freeCreditsInfo = useMemo(() => {
    if (!benefits || plan !== "premium") {
      return {
        available: 0,
        used: 0,
      };
    }
    const available = Math.max(0, benefits.freePromotionsRemaining ?? 0);
    const used = Math.min(available, listingCount);
    return { available, used };
  }, [benefits, listingCount, plan]);

  const paidBoostCount = Math.max(0, listingCount - freeCreditsInfo.used);
  const totalDue = Number((paidBoostCount * pricePerBoost).toFixed(2));
  const requiresPaymentMethod = totalDue > 0;

  const confirmLabel = processing
    ? "Scheduling…"
    : totalDue > 0
    ? `Pay $${totalDue.toFixed(2)} & Boost`
    : "Boost with free credits";

  const disableConfirm =
    processing || listingCount === 0 || (requiresPaymentMethod && !selectedPaymentMethod);

  const handleConfirm = async () => {
    if (disableConfirm) {
      return;
    }

    try {
      setProcessing(true);
      const response = await listingsService.boostListings({
        listingIds,
        plan,
        paymentMethodId: requiresPaymentMethod
          ? selectedPaymentMethod?.id
          : undefined,
        useFreeCredits: plan === "premium",
      });

      Alert.alert(
        "Boost scheduled",
        `Successfully boosted ${response.createdCount} listing${
          response.createdCount === 1 ? "" : "s"
        }.`,
        [
          {
            text: "OK",
            onPress: () => {
              navigation.popToTop();
              navigation.getParent()?.goBack();
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      let message = "Failed to boost listings. Please try again.";
      if (error instanceof ApiError) {
        message =
          (typeof error.response?.error === "string" && error.response.error) ||
          error.message ||
          message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      Alert.alert("Boost failed", message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#101010" }}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
            accessible
            accessibilityRole="button"
          >
            <Icon name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Boost</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              {listingCount} listing{listingCount === 1 ? "" : "s"} selected
            </Text>
            <Text style={styles.summarySubtitle}>
              {BOOST_DURATION_DAYS}-day boost • {plan === "premium" ? "Premium pricing" : "Standard pricing"}
            </Text>
            {listingNames.length > 0 ? (
              <Text style={styles.summaryMeta} numberOfLines={2}>
                {listingNames.slice(0, 3).join(", ")}
                {listingNames.length > 3
                  ? ` +${listingNames.length - 3} more`
                  : ""}
              </Text>
            ) : null}

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Price per boost</Text>
              <Text style={styles.summaryValue}>${pricePerBoost.toFixed(2)}</Text>
            </View>

            {plan === "premium" ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Free credits applied</Text>
                <Text style={styles.summaryValue}>
                  {freeCreditsInfo.used} / {freeCreditsInfo.available}
                </Text>
              </View>
            ) : null}

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.totalLabel]}>Total due today</Text>
              <Text style={[styles.summaryValue, styles.totalValue]}>
                {totalDue > 0 ? `$${totalDue.toFixed(2)}` : "No charge"}
              </Text>
            </View>
          </View>

          {benefitsLoading ? (
            <Text style={styles.infoText}>Refreshing membership benefits…</Text>
          ) : null}
          {benefitsError ? (
            <Text style={styles.warningText}>{benefitsError}</Text>
          ) : null}

          {requiresPaymentMethod ? (
            <PaymentSelector
              selectedPaymentMethodId={selectedPaymentMethod?.id ?? null}
              onSelect={setSelectedPaymentMethod}
              style={styles.paymentSelector}
            />
          ) : (
            <View style={styles.noChargeBanner}>
              <Icon name="sparkles-outline" size={18} color="#FFD166" />
              <Text style={styles.noChargeText}>
                Free credits cover this boost. No payment method required.
              </Text>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity
          style={[styles.confirmButton, disableConfirm && { opacity: 0.6 }]}
          onPress={handleConfirm}
          disabled={disableConfirm}
        >
          <Text style={styles.confirmText}>{confirmLabel}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  content: {
    paddingBottom: 32,
    gap: 24,
  },
  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
    gap: 10,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  summarySubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },
  summaryMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 6,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  totalLabel: {
    fontSize: 15,
  },
  totalValue: {
    fontSize: 16,
  },
  infoText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
  },
  warningText: {
    fontSize: 12,
    color: "#FFD166",
    textAlign: "center",
  },
  paymentSelector: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
  },
  noChargeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,209,102,0.1)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  noChargeText: {
    fontSize: 13,
    color: "#FFD166",
    flex: 1,
  },
  confirmButton: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#141414",
  },
});
