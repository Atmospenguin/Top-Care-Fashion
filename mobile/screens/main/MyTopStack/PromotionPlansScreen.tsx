import React, { useState } from "react";
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
const BACKGROUND_IMAGE = PREMIUM_BG;


export default function PromotionPlansScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<PremiumStackParamList>>();
  const [selectedPlan, setSelectedPlan] = useState<"free" | "premium">("free");

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
            <Text style={styles.heading}>Promotion Plan</Text>

            <View style={styles.planGroup}>
              <Text style={styles.planTitle}>Plan1: For Free User</Text>
              <PlanOptionCard
                prefix="3-days / "
                highlight="$ 2.99"
                selected={selectedPlan === "free"}
                onPress={() => setSelectedPlan("free")}
              />
            </View>

            <View style={styles.planGroup}>
              <Text style={styles.planTitle}>Plan2: For Premium Member</Text>
              <PlanOptionCard
                prefix="3-days / Only "
                highlight="$ 2.00"
                selected={selectedPlan === "premium"}
                onPress={() => setSelectedPlan("premium")}
              />
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate("PremiumPlans")}
              style={styles.learnMoreArea}
            >
              <Text style={styles.learnMoreText}>
                Click to Learn more about Premium benefits
              </Text>
            </TouchableOpacity>
          </ScrollView>

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
  planGroup: {
    rowGap: 14,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
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
