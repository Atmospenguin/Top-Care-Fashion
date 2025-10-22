import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import Icon from "../../../components/Icon";
import type { HomeStackParamList } from "./index";
import { fetchListings } from "../../../api";
import AdaptiveImage from "../../../components/AdaptiveImage";
import type { RootStackParamList } from "../../../App";
import type { ListingItem } from "../../../types/shop";

export default function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [searchText, setSearchText] = useState("");
  const [featuredItems, setFeaturedItems] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取推荐商品数据
  useEffect(() => {
    const loadFeaturedItems = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔍 HomeScreen: Loading featured items...');
        const items = await fetchListings({ limit: 6 });
        console.log('🔍 HomeScreen: Received items:', items?.length || 0);
        console.log('🔍 HomeScreen: Items data:', items);
        setFeaturedItems(items);
      } catch (err) {
        console.error('Error loading featured items:', err);
        setError('Failed to load items');
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedItems();
  }, []);

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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading items...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setLoading(true);
                fetchListings({ limit: 6 }).then(setFeaturedItems).catch(() => setError('Failed to load items')).finally(() => setLoading(false));
              }}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {console.log('🔍 HomeScreen: Rendering items:', featuredItems.length)}
            {featuredItems.slice(0, 3).map((item) => (
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
                <AdaptiveImage 
                  uri={item.images?.[0]} 
                  style={styles.itemImg} 
                />
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.price}>${item.price?.toFixed(2) || '0.00'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
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

  // 加载和错误状态
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 14,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  },
});
