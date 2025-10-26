import React, { useCallback, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import type { IconProps } from "../../../components/Icon";
import type { PremiumStackParamList } from "../PremiumStack";
import { DEFAULT_AVATAR } from "../../../constants/assetUrls";
import { PREMIUM_BG } from "../../../constants/assetUrls";
import { useAuth } from "../../../contexts/AuthContext";
import { premiumService } from "../../../src/services";
import { apiClient } from "../../../src/services/api";

const MEMBER_AVATAR = DEFAULT_AVATAR;

type BenefitItem = {
  id: string;
  icon: IconProps["name"];
  bgColor: string;
  iconColor: string;
  title: string;
  subtitle: string;
};

const BENEFITS: BenefitItem[] = [
  {
    id: "commission",
    icon: "cash-outline",
    bgColor: "#E5F5FF",
    iconColor: "#2AB6B6",
    title: "Reduced commission",
    subtitle: "& Boost fee",
  },
  {
    id: "listing",
    icon: "albums-outline",
    bgColor: "#E7F4FF",
    iconColor: "#4A8CFF",
    title: "Unlimited",
    subtitle: "Listing",
  },
  {
    id: "advice",
    icon: "shirt-outline",
    bgColor: "#F7F9D4",
    iconColor: "#8A6EFF",
    title: "Unlimited",
    subtitle: "Mix & Match Advice",
  },
];

export default function MyPremiumScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<PremiumStackParamList>>();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false); // cancel/loading
  const [syncing, setSyncing] = useState(false); // fetch status
  const [freeBoostUsed, setFreeBoostUsed] = useState<number | null>(null);
  const [freeBoostLimit, setFreeBoostLimit] = useState<number | null>(null);
  const [freeBoostRemaining, setFreeBoostRemaining] = useState<number | null>(null);

  const handleRenew = () => {
    navigation.navigate("PremiumPlans");
  };

  const memberName = useMemo(() => user?.username ?? "Member", [user?.username]);
  const memberStatus = useMemo(() => (user?.isPremium ? "Active" : "Inactive"), [user?.isPremium]);
  const expireText = useMemo(() => {
    if (!user?.premiumUntil) return "(No active premium)";
    return `(Membership will expire on ${String(user.premiumUntil).slice(0, 10)})`;
  }, [user?.premiumUntil]);

  // Sync premium status from backend when screen is focused
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      // if not logged in, skip
      if (!user) return () => { isActive = false; };

      const fetchStatus = async () => {
        try {
          setSyncing(true);
          const status = await premiumService.getStatus();
          if (!isActive) return;
          updateUser({ ...(user as any), isPremium: status.isPremium, premiumUntil: status.premiumUntil });

          // Fetch user benefits to get monthly free promotion (boost) counters
          try {
            const res = await apiClient.get<any>("/api/user/benefits");
            const benefits = (res.data as any)?.data?.benefits;
            if (benefits) {
              setFreeBoostUsed(Number(benefits.freePromotionsUsed ?? 0));
              // freePromotionLimit: number | null (premium: 3; free: null)
              setFreeBoostLimit(
                benefits.freePromotionLimit === null
                  ? null
                  : Number(benefits.freePromotionLimit)
              );
              setFreeBoostRemaining(
                benefits.freePromotionsRemaining === null
                  ? null
                  : Number(benefits.freePromotionsRemaining)
              );
            }
          } catch (err) {
            console.log("Fetch user benefits failed", err);
          }
        } catch (e) {
          console.error('Fetch premium status failed', e);
        } finally {
          if (isActive) setSyncing(false);
        }
      };

      fetchStatus();
      return () => { isActive = false; };
    }, [user?.id])
  );

  return (
    <View style={styles.container}>
      <Header title="My Premium" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.membershipCard}>
          <View style={styles.memberRow}>
            {/* 显示用户头像：优先使用远程 avatar_url，否则 fallback 到 DEFAULT_AVATAR */}
            <Image
              source={
                user?.avatar_url
                  ? { uri: String(user.avatar_url) }
                  : MEMBER_AVATAR
              }
              style={styles.avatar}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.memberTitle}>Hi, {memberName}</Text>
              <Text style={styles.memberMeta}>Member status: {memberStatus}</Text>
              <Text style={styles.memberMeta}>
                {syncing
                  ? 'Monthly Free Boost Credits: ...'
                  : user?.isPremium
                    ? `Monthly Free Boost Credits: ${
                        (freeBoostRemaining ?? (freeBoostLimit ?? 0) - (freeBoostUsed ?? 0))
                      }/${freeBoostLimit ?? 3}`
                    : 'Monthly Free Boost Credits: 0/0'}
              </Text>
            </View>
          </View>
          <Text style={styles.expiryText}>{syncing ? 'Syncing membership…' : expireText}</Text>
        </View>

        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Premium User can enjoy :</Text>
          <View style={styles.benefitRow}>
            {BENEFITS.map((benefit) => (
              <View key={benefit.id} style={styles.benefitItem}>
                <View
                  style={[styles.benefitIconWrap, { backgroundColor: benefit.bgColor }]}
                >
                  <Icon name={benefit.icon} size={30} color={benefit.iconColor} />
                </View>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitSubtitle}>{benefit.subtitle}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.outlineButton}
            disabled={loading || !user?.isPremium}
            onPress={async () => {
              try {
                setLoading(true);
                const res = await premiumService.cancel();
                updateUser({ ...(user as any), isPremium: res.isPremium, premiumUntil: res.premiumUntil });
              } catch (e) {
                console.error('Cancel premium failed', e);
              } finally {
                setLoading(false);
              }
            }}
          >
            <Text style={styles.outlineText}>{loading ? 'Cancelling...' : 'Cancel Membership'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleRenew}>
            <Text style={styles.primaryText}>Renew Membership</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    padding: 20,
    rowGap: 20,
  },
  membershipCard: {
    padding: 20,
    backgroundColor: "#DDEEFF",
    borderRadius: 18,
    rowGap: 14,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 18,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
  },
  memberTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E1E1E",
  },
  memberMeta: {
    fontSize: 14,
    color: "#2F3443",
    marginTop: 2,
  },
  expiryText: {
    fontSize: 13,
    color: "#2F3443",
  },
  benefitsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E1E1E",
    marginBottom: 20,
  },
  benefitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  benefitItem: {
    alignItems: "center",
    width: "30%",
  },
  benefitIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    color: "#1E1E1E",
  },
  benefitSubtitle: {
    fontSize: 13,
    textAlign: "center",
    color: "#3F4354",
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    columnGap: 12,
  },
  outlineButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  outlineText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 26,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});