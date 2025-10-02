import React, { useState } from "react";
import {
  ImageBackground,  
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
import type { MyTopStackParamList } from "./index";
import { PREMIUM_BG } from "../../../constants/assetUrls";
import { LOGO_FULL_COLOR } from "../../../constants/assetUrls";

const BACKGROUND_IMAGE = PREMIUM_BG;

const BENEFITS = [
  "Reduced commission fee to 5%",
  "Reduced 30% of Promotion fee",
  "Free Promotion per month (3 times/month)",
  "Unlimited Listing",
  "Unlimited Mix & Match Advice",
];

export default function PremiumPlansScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MyTopStackParamList>>();
  const [selectedPlan, setSelectedPlan] = useState<"1m" | "3m" | "1y">("1m");

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

          <View style={styles.content}>
            <View style={{ alignItems: "flex-start", marginBottom: -10 }}>
              <LOGO_FULL_COLOR width={150} height={60} />
            </View>

            <Text style={styles.heading}>What Premium User can enjoy?</Text>

            <View style={styles.benefitsList}>
              {BENEFITS.map((benefit) => (
                <View key={benefit} style={styles.benefitItem}>
                  <Icon name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>

            <View style={styles.planGroup}>
              <PlanOptionCard
                prefix="1 Month / "
                highlight="$ 6.99"
                selected={selectedPlan === "1m"}
                onPress={() => setSelectedPlan("1m")}
              />
              <PlanOptionCard
                prefix="3 Month / "
                highlight="$ 18.99"
                selected={selectedPlan === "3m"}
                onPress={() => setSelectedPlan("3m")}
              />
              <PlanOptionCard
                prefix="1 Year / "
                highlight="$ 59.99"
                selected={selectedPlan === "1y"}
                onPress={() => setSelectedPlan("1y")}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaText}>GET IT NOW!</Text>
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
  benefitsList: {
    rowGap: 12,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  planGroup: {
    rowGap: 16,
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
