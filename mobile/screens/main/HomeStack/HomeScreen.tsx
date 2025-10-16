import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import Icon from "../../../components/Icon";
import type { HomeStackParamList } from "./index";
import { DEFAULT_BAG_ITEMS, MOCK_LISTINGS } from "../../../mocks/shop";
import AdaptiveImage from "../../../components/AdaptiveImage";
import type { RootStackParamList } from "../../../App";

export default function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [searchText, setSearchText] = useState("");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* 🔍 搜索栏 */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchBar}
            placeholder="Search for anything"
            placeholderTextColor="#666"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            onSubmitEditing={() => {
              // Navigate to SearchResult in Buy stack
              const parent = navigation.getParent()?.getParent();
              parent?.navigate("Buy", { screen: "SearchResult", params: { query: searchText || "" } });
            }}
          />
          <TouchableOpacity
            style={{ marginLeft: 12 }}
            accessibilityRole="button"
            onPress={() =>
              navigation
                .getParent()
                ?.navigate("My TOP", {
                  screen: "MyTopMain",
                  params: { initialTab: "Likes" },
                })
            }
          >
            <Icon name="heart-outline" size={24} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginLeft: 12 }}
            accessibilityRole="button"
            onPress={() =>
              // Jump to root Buy stack
              (navigation as any)
                .getParent()
                ?.getParent()
                ?.navigate("Buy", {
                  screen: "Bag",
                  params: { items: DEFAULT_BAG_ITEMS },
                } as any)
            }
          >
            <Icon name="bag-outline" size={24} color="#111" />
          </TouchableOpacity>
        </View>

        {/* 🌟 Premium Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Style smarter with AI Mix & Match</Text>
          <Text style={styles.bannerSubtitle}>
            Unlimited Mix & Match Styling{"\n"}Reduced commission fees & Free boosts
          </Text>
          <TouchableOpacity
            style={styles.premiumBtn}
            onPress={() => {
              const rootNavigation = navigation
                .getParent()
                ?.getParent() as
                | NativeStackNavigationProp<RootStackParamList>
                | undefined;

              rootNavigation?.navigate("Premium", {
                screen: "PremiumPlans",
              });
            }}
          >
            <Text style={styles.premiumText}>Get Premium</Text>
          </TouchableOpacity>
        </View>

        {/* 👕 推荐区 */}
        <Text style={styles.sectionTitle}>Suggested for you</Text>
        <View style={styles.grid}>
          {MOCK_LISTINGS.slice(0, 3).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() =>
                (navigation as any)
                  .getParent()
                  ?.getParent()
                  ?.navigate("Buy", {
                    screen: "ListingDetail",
                    params: { item },
                  } as any)
              }
              accessibilityRole="button"
            >
              <AdaptiveImage uri={item.images[0]} style={styles.itemImg} />
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.price}>${item.price.toFixed(2)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },

  // 搜索
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f3f3f3",
    paddingHorizontal: 16,
    fontSize: 15,
  },

  // Banner
  banner: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  bannerTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  bannerSubtitle: { fontSize: 14, color: "#555", marginBottom: 12 },
  premiumBtn: {
    backgroundColor: "#000",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  premiumText: { color: "#fff", fontWeight: "700" },

  // 推荐
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { width: "48%", marginBottom: 16 },
  // itemImg uses AdaptiveImage which provides width:100% + aspectRatio dynamically
  itemImg: { borderRadius: 8, marginBottom: 6, overflow: "hidden" },
  cardTitle: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  price: { fontWeight: "700" },
});
