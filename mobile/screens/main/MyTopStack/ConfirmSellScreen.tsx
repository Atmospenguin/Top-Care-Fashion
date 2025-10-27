import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import {
  benefitsService,
  listingsService,
  paymentMethodsService,
  type UserBenefitsPayload,
} from "../../../src/services";
import type { PaymentMethod } from "../../../src/services/paymentMethodsService";
import type { CreateListingRequest } from "../../../src/services/listingsService";
import type { MyTopStackParamList } from "./index";
import type { ListingItem } from "../../../types/shop";

type ConfirmCreateParams = {
  mode: "create";
  draft: CreateListingRequest;
  benefitsSnapshot?: UserBenefitsPayload["benefits"] | null;
};

type ConfirmUpdateParams = {
  mode: "update";
  listingId: string;
  draft: Partial<CreateListingRequest>;
  listingSnapshot?: ListingItem;
  benefitsSnapshot?: UserBenefitsPayload["benefits"] | null;
};

type ConfirmMarkSoldParams = {
  mode: "markSold";
  listingId: string;
  listingSnapshot?: ListingItem;
};

function isMarkSoldParams(
  params: MyTopStackParamList["ConfirmSell"]
): params is ConfirmMarkSoldParams {
  return params.mode === "markSold";
}

function isCreateParams(
  params: MyTopStackParamList["ConfirmSell"]
): params is ConfirmCreateParams {
  return params.mode === "create";
}

function isUpdateParams(
  params: MyTopStackParamList["ConfirmSell"]
): params is ConfirmUpdateParams {
  return params.mode === "update";
}

export default function ConfirmSellScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MyTopStackParamList, "ConfirmSell">>();
  const route = useRoute<RouteProp<MyTopStackParamList, "ConfirmSell">>();
  const params = route.params;

  const createMode = isCreateParams(params);
  const updateMode = isUpdateParams(params);
  const markSoldParams = isMarkSoldParams(params) ? params : null;
  const updateParams = updateMode ? params : null;

  const createDraft = createMode ? params.draft : null;
  const updateDraft = updateMode ? params.draft : null;
  const markSoldListingId = markSoldParams?.listingId ?? null;
  const initialListingSnapshot =
    markSoldParams?.listingSnapshot ?? updateParams?.listingSnapshot ?? null;
  const initialBenefits = createMode
    ? params.benefitsSnapshot ?? null
    : updateMode
    ? updateParams?.benefitsSnapshot ?? null
    : null;

  const [listing, setListing] = useState<ListingItem | null>(initialListingSnapshot);
  const [finalListing, setFinalListing] = useState<ListingItem | null>(null);
  const [loadingListing, setLoadingListing] = useState(
    !!markSoldListingId && !initialListingSnapshot
  );
  const [benefits, setBenefits] = useState<UserBenefitsPayload["benefits"] | null>(
    initialBenefits ?? null
  );
  const [loadingBenefits, setLoadingBenefits] = useState(!initialBenefits);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!markSoldListingId) {
      setLoadingListing(false);
      return;
    }

    if (initialListingSnapshot) {
      setLoadingListing(false);
      return;
    }

    let cancelled = false;

    const loadListing = async () => {
      try {
        setLoadingListing(true);
        const fetched = await listingsService.getListingById(markSoldListingId);
        if (!cancelled) {
          setListing(fetched);
        }
      } catch (error) {
        console.error("Failed to load listing for confirm sell:", error);
        if (!cancelled) {
          Alert.alert("Error", "Failed to load listing", [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]);
        }
      } finally {
        if (!cancelled) {
          setLoadingListing(false);
        }
      }
    };

    loadListing();
    return () => {
      cancelled = true;
    };
  }, [initialListingSnapshot, markSoldListingId, navigation]);

  useEffect(() => {
    if (benefits) {
      setLoadingBenefits(false);
      return;
    }

    let cancelled = false;

    const loadBenefits = async () => {
      try {
        setLoadingBenefits(true);
        const payload = await benefitsService.getUserBenefits();
        if (!cancelled) {
          setBenefits(payload.benefits);
        }
      } catch (error) {
        console.warn("Unable to load benefits for confirm sell", error);
      } finally {
        if (!cancelled) {
          setLoadingBenefits(false);
        }
      }
    };

    loadBenefits();
    return () => {
      cancelled = true;
    };
  }, [benefits]);

  useEffect(() => {
    let cancelled = false;
    const loadPayment = async () => {
      try {
        setLoadingPayment(true);
        const method = await paymentMethodsService.getDefaultPaymentMethod();
        if (!cancelled) {
          setPaymentMethod(method);
        }
      } catch (error) {
        console.warn("Unable to load payout method", error);
      } finally {
        if (!cancelled) {
          setLoadingPayment(false);
        }
      }
    };

    loadPayment();
    return () => {
      cancelled = true;
    };
  }, []);

  const previewData = useMemo<
    (Partial<ListingItem> & Partial<CreateListingRequest>) | CreateListingRequest | ListingItem | null
  >(() => {
    if (finalListing) {
      return finalListing;
    }
    if (updateMode) {
      const merged = { ...(listing ?? {}), ...(updateDraft ?? {}) };
      return merged as Partial<ListingItem> & Partial<CreateListingRequest>;
    }
    if (createMode) {
      return createDraft ?? null;
    }
    return listing;
  }, [createDraft, createMode, finalListing, listing, updateDraft, updateMode]);

  const fallbackDraft = createDraft ?? updateDraft ?? null;

  const displayTitle = previewData?.title ?? fallbackDraft?.title ?? "Untitled listing";
  const displayBrand = previewData?.brand ?? fallbackDraft?.brand ?? "";
  const displaySize = previewData?.size ?? fallbackDraft?.size ?? "";
  const metaParts = [] as string[];
  if (displayBrand) {
    metaParts.push(displayBrand);
  }
  if (displaySize) {
    metaParts.push(`Size ${displaySize}`);
  }
  const displayMeta = metaParts.join(" | ");
  const displayImages = previewData?.images && previewData.images.length
    ? previewData.images
    : fallbackDraft?.images ?? [];
  const primaryImage = displayImages.length ? displayImages[0] : null;

  const salePriceRaw = previewData?.price ?? fallbackDraft?.price ?? 0;
  const salePrice = Number(salePriceRaw ?? 0);
  const commissionRate = benefits?.commissionRate ?? 0.1;
  const commissionPercent = Math.round((commissionRate || 0) * 100);
  const commissionAmount = Number((salePrice * commissionRate).toFixed(2));
  const payoutAmount = Math.max(0, Number((salePrice - commissionAmount).toFixed(2)));

  const loadingContent = !!markSoldListingId && loadingListing;
  const hasCompleted = !!finalListing;

  const confirmLabel = (() => {
    if (processing) {
      if (createMode) {
        return "Posting...";
      }
      if (updateMode) {
        return "Saving...";
      }
      return "Processing...";
    }

    if (createMode) {
      return hasCompleted ? "Back to MyTop" : "Post listing";
    }

    if (updateMode) {
      return hasCompleted ? "Back to MyTop" : "Save changes";
    }

    return "Confirm & Mark as Sold";
  })();

  const confirmDisabled = processing || (!!markSoldListingId && loadingListing);

  const navigateToBoost = (target: ListingItem) => {
    const boostParams = {
      selectedListingIds: [target.id] as string[],
      selectedListings: [target] as ListingItem[],
      benefitsSnapshot: benefits,
    };

    const parentNavigator = (navigation as any)?.getParent?.();
    const rootNavigator = parentNavigator?.getParent?.();

    if (rootNavigator?.navigate) {
      rootNavigator.navigate("Premium", {
        screen: "PromotionPlans",
        params: boostParams,
      });
      return;
    }

    if (parentNavigator?.navigate) {
      parentNavigator.navigate("Premium", {
        screen: "PromotionPlans",
        params: boostParams,
      });
      return;
    }

    navigation.navigate("PromotionPlans", boostParams);
  };

  const handleBoost = () => {
    const target = finalListing ?? listing;
    if (!target) {
      return;
    }
    navigateToBoost(target);
  };

  const handleDismiss = () => {
    navigation.goBack();
  };

  const returnToMyTopHome = () => {
    const stackState = navigation.getState?.();
    if (stackState && Array.isArray(stackState.routes) && stackState.routes.length > 1) {
      navigation.popToTop();
      return;
    }

    const parentNavigator = (navigation as any)?.getParent?.();
    const rootNavigator = parentNavigator?.getParent?.();

    if (parentNavigator?.navigate) {
      parentNavigator.navigate("My TOP", {
        screen: "MyTopMain",
        params: { refreshTS: Date.now() },
      });
      return;
    }

    if (rootNavigator?.navigate) {
      rootNavigator.navigate("Main", {
        screen: "My TOP",
        params: {
          screen: "MyTopMain",
          params: { refreshTS: Date.now() },
        },
      });
      return;
    }

    navigation.navigate("MyTopMain");
  };

  const handleConfirmSell = async () => {
    if (processing) {
      return;
    }

    if (createMode) {
      if (hasCompleted) {
        returnToMyTopHome();
        return;
      }

      if (!createDraft) {
        Alert.alert("Missing information", "Unable to post this listing.");
        return;
      }

      try {
        setProcessing(true);
        const created = await listingsService.createListing(createDraft);
        setFinalListing(created);
        setListing(created);
        Alert.alert(
          "Listing posted",
          "Your listing is live! Boost it now to reach more buyers?",
          [
            { text: "Maybe later", style: "cancel" },
            {
              text: "Boost now",
              onPress: () => navigateToBoost(created),
            },
          ]
        );
      } catch (error) {
        console.error("Failed to post listing:", error);
        let message = "Failed to post listing. Please try again.";
        if (error instanceof Error && error.message) {
          message = error.message;
        }
        Alert.alert("Error", message);
      } finally {
        setProcessing(false);
      }
      return;
    }

    if (updateMode) {
      if (hasCompleted) {
        returnToMyTopHome();
        return;
      }

      if (!updateDraft || !updateParams?.listingId) {
        Alert.alert("Missing information", "Unable to update this listing.");
        return;
      }

      try {
        setProcessing(true);
        const updated = await listingsService.updateListing(
          updateParams.listingId,
          updateDraft
        );
        setFinalListing(updated);
        setListing(updated);
        Alert.alert(
          "Listing updated",
          "Your changes are live! Boost it now to keep your listing visible?",
          [
            { text: "Maybe later", style: "cancel" },
            {
              text: "Boost now",
              onPress: () => navigateToBoost(updated),
            },
          ]
        );
      } catch (error) {
        console.error("Failed to update listing:", error);
        let message = "Failed to update listing. Please try again.";
        if (error instanceof Error && error.message) {
          message = error.message;
        }
        Alert.alert("Error", message);
      } finally {
        setProcessing(false);
      }
      return;
    }

    if (!markSoldListingId) {
      Alert.alert("Missing listing", "We could not find this listing.");
      return;
    }

    try {
      setProcessing(true);
      await listingsService.updateListing(markSoldListingId, {
        sold: true,
        listed: false,
      });
      Alert.alert(
        "Sale confirmed",
        "We'll notify the buyer that this listing is sold.",
        [
          {
            text: "Done",
            onPress: () => navigation.goBack(),
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error("Failed to mark listing as sold:", error);
      let message = "Failed to confirm the sale. Please try again.";
      if (error instanceof Error && error.message) {
        message = error.message;
      }
      Alert.alert("Error", message);
    } finally {
      setProcessing(false);
    }
  };

  const showSuccessBanner = (createMode || updateMode) && hasCompleted;
  const successTitle = createMode ? "Listing posted" : "Listing updated";
  const successSubtitle = createMode
    ? "Promote it with a boost to stay on top of search results."
    : "Boost it to keep your listing high in search results.";

  return (
    <View style={{ flex: 1, backgroundColor: "#09090B" }}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleDismiss}
            accessibilityRole="button"
          >
            <Icon name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {createMode ? "Review & Post" : updateMode ? "Review Changes" : "Confirm Sell"}
          </Text>
          <View style={{ width: 26 }} />
        </View>

        {loadingContent ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading listing</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {showSuccessBanner ? (
              <View style={styles.successBanner}>
                <Icon name="checkmark-circle" size={22} color="#22C55E" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.successTitle}>{successTitle}</Text>
                  <Text style={styles.successSubtitle}>{successSubtitle}</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.listingCard}>
              {primaryImage ? (
                <Image source={{ uri: primaryImage }} style={styles.thumbnail} />
              ) : (
                <View style={[styles.thumbnail, styles.placeholder]}>
                  <Icon name="image-outline" size={22} color="rgba(255,255,255,0.4)" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.listingTitle} numberOfLines={2}>
                  {displayTitle}
                </Text>
                <Text style={styles.listingMeta}>{displayMeta}</Text>
                <Text style={styles.listingPrice}>${salePrice.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.breakdownCard}>
              <Text style={styles.sectionLabel}>Payout summary</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Sale price</Text>
                <Text style={styles.rowValue}>${salePrice.toFixed(2)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Commission ({commissionPercent}%)</Text>
                <Text style={[styles.rowValue, styles.negativeValue]}>
                  - ${commissionAmount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>You receive</Text>
                <Text style={styles.totalValue}>${payoutAmount.toFixed(2)}</Text>
              </View>
              {loadingBenefits ? (
                <Text style={styles.caption}>Checking your membership perks...</Text>
              ) : null}
            </View>

            <View style={styles.payoutCard}>
              <View style={styles.payoutHeader}>
                <Icon name="card" size={18} color="#FFD166" />
                <Text style={styles.payoutTitle}>Payout destination</Text>
              </View>
              {loadingPayment ? (
                <View style={styles.payoutLoading}>
                  <ActivityIndicator color="#FFD166" size="small" />
                  <Text style={styles.caption}>Loading your default payout method...</Text>
                </View>
              ) : paymentMethod ? (
                <>
                  <Text style={styles.payoutLabel}>{paymentMethod.label}</Text>
                  <Text style={styles.payoutDetails}>
                    {paymentMethod.brand ?? "Account"}
                    {paymentMethod.last4 ? ` **** ${paymentMethod.last4}` : ""}
                  </Text>
                  {paymentMethod.expiryMonth && paymentMethod.expiryYear ? (
                    <Text style={styles.payoutDetails}>
                      Expires {String(paymentMethod.expiryMonth).padStart(2, "0")}/
                      {paymentMethod.expiryYear}
                    </Text>
                  ) : null}
                </>
              ) : (
                <>
                  <Text style={styles.payoutLabel}>No payout method set</Text>
                  <Text style={styles.caption}>
                    Add a payout method in Manage Payments so we know where to send your earnings.
                  </Text>
                </>
              )}
            </View>
          </ScrollView>
        )}

        {(createMode || updateMode) && hasCompleted ? (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleBoost}
            disabled={!finalListing}
          >
            <Text style={styles.secondaryButtonText}>Boost listing now</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.confirmButton, confirmDisabled && { opacity: 0.6 }]}
          onPress={handleConfirmSell}
          disabled={confirmDisabled}
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    rowGap: 10,
  },
  loadingText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
  content: {
    paddingBottom: 32,
    rowGap: 20,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(34,197,94,0.35)",
  },
  successTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#22C55E",
  },
  successSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  listingCard: {
    flexDirection: "row",
    columnGap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  listingMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  listingPrice: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  breakdownCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
    rowGap: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  negativeValue: {
    color: "#F87171",
  },
  totalRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  caption: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
  },
  payoutCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: "rgba(36,36,42,0.9)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
    rowGap: 8,
  },
  payoutHeader: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
  },
  payoutTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFD166",
  },
  payoutLoading: {
    rowGap: 10,
  },
  payoutLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  payoutDetails: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  secondaryButton: {
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  confirmButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#121212",
  },
});
