import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import type { IconProps } from "../../../components/Icon";
import type { PremiumStackParamList } from "../PremiumStack";
import { DEFAULT_AVATAR } from "../../../constants/assetUrls";
import { PREMIUM_BG } from "../../../constants/assetUrls";

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
    subtitle: "& Promotion fee",
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

  const handlePromotionUpsell = () => {
    navigation.navigate("PromotionPlans");
  };

  const handleRenew = () => {
    navigation.navigate("PremiumPlans");
  };

  return (
    <View style={styles.container}>
      <Header title="My Premium" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.membershipCard}>
          <View style={styles.memberRow}>
            <Image source={MEMBER_AVATAR} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.memberTitle}>Hi, Member ccc446981</Text>
              <Text style={styles.memberMeta}>Member status: Active</Text>
              <Text style={styles.memberMeta}>
                Monthly Free Promotion Credits: 1/3
              </Text>
            </View>
          </View>
          <Text style={styles.expiryText}>
            (Membership will expire on 2025-10-05)
          </Text>
        </View>

        <View style={styles.upsellCard}>
          <View style={styles.upsellHeader}>
            <View style={styles.upsellIconWrap}>
              <Icon name="trending-up" size={18} color="#1E1E1E" />
            </View>
            <Text style={styles.upsellTitle}>
              Promotion credits are Not enough?
            </Text>
          </View>
          <TouchableOpacity onPress={handlePromotionUpsell}>
            <Text style={styles.upsellLink}>Click To Get Promotion Adds on</Text>
          </TouchableOpacity>
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
          <TouchableOpacity style={styles.outlineButton}>
            <Text style={styles.outlineText}>Cancel Membership</Text>
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
  upsellCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 1,
    rowGap: 8,
  },
  upsellHeader: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
  },
  upsellIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F2F4F8",
    alignItems: "center",
    justifyContent: "center",
  },
  upsellTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1E1E1E",
  },
  upsellLink: {
    fontSize: 14,
    color: "#2A7BF4",
    fontWeight: "600",
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