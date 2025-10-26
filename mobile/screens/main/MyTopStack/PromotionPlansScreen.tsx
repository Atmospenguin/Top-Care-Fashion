import React, { useEffect, useMemo, useState } from "react";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import Icon from "../../../components/Icon";
import PlanOptionCard from "../../../components/PlanOptionCard";
import type { PremiumStackParamList } from "../PremiumStack";
import { PREMIUM_BG } from "../../../constants/assetUrls";
import { LOGO_FULL_COLOR } from "../../../constants/assetUrls";
import { benefitsService, type UserBenefitsPayload } from "../../../src/services";
import { apiClient } from "../../../src/services/api";
const BACKGROUND_IMAGE = PREMIUM_BG;

type PricingPlan = {
  type: string;
  name: string;
  promotionPrice: number;
  promotionDiscount?: number | null;
  listingLimit?: number | null;
  commissionRate?: number | null;
  freePromotionCredits?: number | null;
};

type DetailRow = {
  label: string;
  value: string;
};


export default function PromotionPlansScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<PremiumStackParamList>>();
  const [selectedPlan, setSelectedPlan] = useState<"free" | "premium">("free");
  const [benefits, setBenefits] = useState<UserBenefitsPayload["benefits"] | null>(null);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const [benefitsPayload, plansResponse] = await Promise.all([
          benefitsService.getUserBenefits().catch((err) => {
            console.warn("Failed to load benefits for promotion screen", err);
            return null;
          }),
          apiClient
            .get<{ plans: PricingPlan[] }>("/api/pricing-plans")
            .catch((err) => {
              console.warn("Failed to load pricing plans", err);
              return { data: { plans: [] as PricingPlan[] } };
            }),
        ]);

        if (!mounted) {
          return;
        }

        if (benefitsPayload?.benefits) {
          setBenefits(benefitsPayload.benefits);
          if (benefitsPayload.benefits.isPremium) {
            setSelectedPlan("premium");
          }
        }

        if (Array.isArray(plansResponse.data?.plans)) {
          setPlans(plansResponse.data.plans);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const freePlan = useMemo(() => plans.find((plan) => plan.type === "FREE"), [plans]);
  const premiumPlan = useMemo(() => plans.find((plan) => plan.type === "PREMIUM"), [plans]);

  const normalisePercent = (value?: number | null) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return 0;
    }
    return value <= 1 ? Math.round(value * 100) : Math.round(value);
  };

  const freePlanPrice = freePlan?.promotionPrice ?? 2.9;
  const premiumPlanPrice = premiumPlan?.promotionPrice ?? 2.0;
  const premiumDiscountPercent = normalisePercent(premiumPlan?.promotionDiscount);
  const freeListingLimit = freePlan?.listingLimit ?? 2;
  const freeCommissionPercent = normalisePercent(freePlan?.commissionRate) || 10;
  const premiumCommissionPercent = normalisePercent(premiumPlan?.commissionRate) || 5;
  const premiumFreeCredits = premiumPlan?.freePromotionCredits ?? 3;

  const freePlanNote = loading
    ? "Loading plan details..."
    : freeListingLimit === null
      ? "No free boosts · unlimited listings"
      : `No free boosts · ${freeListingLimit} active listings`;

  const premiumPlanNote = loading
    ? "Loading plan details..."
    : `${premiumFreeCredits} free boosts/month · ${
        premiumDiscountPercent > 0 ? `${premiumDiscountPercent}% off` : "member pricing"
      }`;

  const selectedDetails: DetailRow[] = useMemo(() => {
    if (selectedPlan === "premium") {
      const listingLimitLabel = premiumPlan?.listingLimit ?? null;
      const rows: Array<DetailRow | null> = [
        {
          label: "Listing limit",
          value: listingLimitLabel === null ? "Unlimited" : `${listingLimitLabel} active listings`,
        },
        {
          label: "Boost price (3 days)",
          value: premiumDiscountPercent > 0
            ? `$${premiumPlanPrice.toFixed(2)} (${premiumDiscountPercent}% off)`
            : `$${premiumPlanPrice.toFixed(2)}`,
        },
        {
          label: "Free boosts / month",
          value: `${premiumFreeCredits} credits`,
        },
        {
          label: "Commission rate",
          value: `${premiumCommissionPercent}%`,
        },
        benefits?.isPremium
          ? {
              label: "Your remaining free boosts",
              value:
                benefits.freePromotionLimit === null
                  ? "Unlimited"
                  : `${Math.max(0, benefits.freePromotionsRemaining)}/${benefits.freePromotionLimit}`,
            }
          : null,
      ];

      return rows.filter(Boolean) as DetailRow[];
    }

    return [
      {
        label: "Listing limit",
        value: `${freeListingLimit} active listings`,
      },
      {
        label: "Boost price (3 days)",
        value: `$${freePlanPrice.toFixed(2)}`,
      },
      {
        label: "Free boosts",
        value: "None",
      },
      {
        label: "Commission rate",
        value: `${freeCommissionPercent}%`,
      },
    ];
  }, [
    benefits,
    freeCommissionPercent,
    freeListingLimit,
    freePlanPrice,
    premiumCommissionPercent,
    premiumDiscountPercent,
    premiumFreeCredits,
    premiumPlan,
    premiumPlanPrice,
    selectedPlan,
  ]);

  const memberHint = useMemo(() => {
    if (!benefits || selectedPlan !== "premium") return null;
    if (benefits.isPremium) {
      return null;
    }
    return "Upgrade to Premium to unlock monthly free boosts and discounted pricing.";
  }, [benefits, selectedPlan]);

  const isPremiumMember = benefits?.isPremium === true;
  const isSelectingPremium = selectedPlan === "premium";
  const ctaLabel = isSelectingPremium
    ? (isPremiumMember ? "MANAGE MEMBERSHIP" : "UPGRADE & BOOST")
    : "CONTINUE WITH FREE PLAN";

  const handleCtaPress = () => {
    if (isSelectingPremium) {
      navigation.navigate("PremiumPlans");
      return;
    }
    navigation.goBack();
  };

  return (
    <ImageBackground source={BACKGROUND_IMAGE} style={styles.background}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity
            accessible
            accessibilityRole="button"
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ alignItems: "flex-start", marginBottom: -10 }}>
              <LOGO_FULL_COLOR width={150} height={60} />
            </View>
            <Text style={styles.heading}>Boost Plans</Text>

            <View style={styles.planGroup}>
              <Text style={styles.planTitle}>
                {`Free plan${!benefits || !benefits.isPremium ? " (current)" : ""}`}
              </Text>
              <PlanOptionCard
                prefix="3 days / "
                highlight={`$ ${freePlanPrice.toFixed(2)}`}
                note={freePlanNote}
                selected={selectedPlan === "free"}
                onPress={() => setSelectedPlan("free")}
              />
            </View>

            <View style={styles.planGroup}>
              <Text style={styles.planTitle}>
                {`Premium plan${benefits?.isPremium ? " (current)" : ""}`}
              </Text>
              <PlanOptionCard
                prefix="3 days / "
                highlight={`$ ${premiumPlanPrice.toFixed(2)}`}
                note={premiumPlanNote}
                selected={selectedPlan === "premium"}
                onPress={() => setSelectedPlan("premium")}
              />
            </View>

            <View style={styles.detailCard}>
              {selectedDetails.map((row) => (
                <View key={row.label} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{row.label}</Text>
                  <Text style={styles.detailValue}>{row.value}</Text>
                </View>
              ))}
            </View>

            {memberHint ? (
              <Text style={styles.memberHint}>{memberHint}</Text>
            ) : null}

            {!isPremiumMember ? (
              <TouchableOpacity
                onPress={() => navigation.navigate("PremiumPlans")}
                style={styles.learnMoreArea}
              >
                <Text style={styles.learnMoreText}>
                  Explore full Premium membership benefits
                </Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>

          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleCtaPress}
          >
            <Text style={styles.ctaText}>
              {ctaLabel}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  closeButton: {
    alignSelf: "flex-start",
    marginBottom: 24,
  },
  content: {
    paddingBottom: 40,
    rowGap: 28,
  },
  logoText: {
    fontSize: 56,
    fontWeight: "800",
    color: "#FF3B2F",
    letterSpacing: 2,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 4,
  },
  planGroup: {
    rowGap: 14,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  detailCard: {
    marginTop: 4,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 18,
    paddingVertical: 14,
    rowGap: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  memberHint: {
    marginTop: 12,
    fontSize: 13,
    color: "#F5D66F",
    textAlign: "left",
  },
  learnMoreArea: {
    marginTop: 12,
  },
  learnMoreText: {
    fontSize: 14,
    textAlign: "center",
    color: "#F5D66F",
    fontWeight: "600",
  },
  ctaButton: {
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#141414",
  },
});
