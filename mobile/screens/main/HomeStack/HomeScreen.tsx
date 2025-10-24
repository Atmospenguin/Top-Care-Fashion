import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import Icon from "../../../components/Icon";
import type { HomeStackParamList } from "./index";
import { fetchListings } from "../../../api";
import type { RootStackParamList } from "../../../App";
import type { ListingItem } from "../../../types/shop";
import { useAuth } from "../../../contexts/AuthContext";

export default function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [searchText, setSearchText] = useState("");
  const [featuredItems, setFeaturedItems] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated } = useAuth();

  // 获取推荐商品数据（仅登录后触发）
  useEffect(() => {
    const loadFeaturedItems = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔍 HomeScreen: Loading featured items...');
        const items = await fetchListings({ limit: 20 });
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

    if (isAuthenticated) {
      loadFeaturedItems();
    } else {
      // 未登录时重置状态，避免界面显示旧数据
      setFeaturedItems([]);
      setLoading(false);
      setError(null);
    }
  }, [isAuthenticated]);

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
                fetchListings({ limit: 20 }).then(setFeaturedItems).catch(() => setError('Failed to load items')).finally(() => setLoading(false));
              }}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.gridWrapper}>
            {featuredItems.map((item) => {
              const primaryImage =
                (Array.isArray(item.images) && item.images[0]) ||
                "https://via.placeholder.com/300x300/f4f4f4/999999?text=No+Image";

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.gridItem}
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
                  <Image
                    source={{ uri: primaryImage }}
                    style={styles.gridImage}
                  />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.itemPrice}>${item.price?.toFixed(2) || "0.00"}</Text>
                    {item.size && (
                      <Text style={styles.itemSize} numberOfLines={1}>
                        Size {item.size}
                      </Text>
                    )}
                    {item.material && (
                      <Text style={styles.itemMaterial} numberOfLines={1}>
                        {item.material}
                      </Text>
                    )}
                    {Array.isArray(item.tags) && item.tags.length > 0 && (
                      <View style={styles.itemTags}>
                        {item.tags.slice(0, 2).map((tag, index) => (
                          <View key={index} style={styles.itemTagChip}>
                            <Text style={styles.itemTagText}>{tag}</Text>
                          </View>
                        ))}
                        {item.tags.length > 2 && (
                          <Text style={styles.itemTagMore}>+{item.tags.length - 2}</Text>
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
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
  gridWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  gridItem: {
    width: "48%",
    marginHorizontal: 4,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ededed",
  },
  gridImage: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#f1f1f1",
  },
  itemInfo: {
    padding: 10,
    rowGap: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  itemSize: {
    fontSize: 12,
    color: "#666",
  },
  itemMaterial: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
    fontStyle: "italic",
  },
  itemTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
    gap: 4,
  },
  itemTagChip: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
  },
  itemTagText: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
  },
  itemTagMore: {
    fontSize: 10,
    color: "#999",
    fontStyle: "italic",
    alignSelf: "center",
  },

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
