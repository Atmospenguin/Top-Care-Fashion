import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image, RefreshControl, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, useScrollToTop, type NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { RouteProp } from "@react-navigation/native";

import Icon from "../../../components/Icon";
import type { HomeStackParamList } from "./index";
import type { RootStackParamList } from "../../../App";
import type { MyTopStackParamList } from "../MyTopStack";
import type { ListingItem } from "../../../types/shop";
import { useAuth } from "../../../contexts/AuthContext";
import { listingsService } from "../../../src/services/listingsService";

type MainTabParamList = {
  Home: undefined;
  Discover: undefined;
  Sell: undefined;
  Inbox: undefined;
  "My TOP": NavigatorScreenParams<MyTopStackParamList> | undefined;
};

export default function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, "HomeMain">>();
  const lastRefreshRef = useRef<number | null>(null);
  const scrollRef = useRef<FlatList<ListingItem> | null>(null);
  const scrollOffsetRef = useRef(0);
  const [searchText, setSearchText] = useState("");
  const [featuredItems, setFeaturedItems] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<TextInput>(null); // 🔥 添加搜索框引用

  // Pagination state
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const PAGE_SIZE = 20;

  const { isAuthenticated } = useAuth();

  // 获取推荐商品数据（仅登录后触发）
  const loadFeaturedItems = useCallback(async (opts?: { isRefresh?: boolean }) => {
    try {
      setError(null);
      if (opts?.isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('🔍 HomeScreen: Loading featured items...');
      const result = await listingsService.getListings({
        limit: PAGE_SIZE,
        offset: 0,
      });

      console.log('🔍 HomeScreen: Received items:', result.items.length);
      console.log('🔍 HomeScreen: Has more:', result.hasMore);

      // 🔥 去重：防止后端返回重复数据
      const uniqueItems = Array.from(
        new Map(result.items.map(item => [item.id, item])).values()
      );
      console.log('🔍 HomeScreen: After dedup:', uniqueItems.length, 'unique items');
      
      setFeaturedItems(uniqueItems);
      setHasMore(result.hasMore);
      setOffset(PAGE_SIZE);
    } catch (err) {
      console.error('Error loading featured items:', err);
      setError('Failed to load items');
      setFeaturedItems([]);
      setHasMore(false);
    } finally {
      if (opts?.isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  // Load more items when scrolling to bottom
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || loading || !isAuthenticated) {
      console.log('🔍 HomeScreen: Skip load more', { hasMore, isLoadingMore, loading, isAuthenticated });
      return;
    }

    try {
      setIsLoadingMore(true);
      console.log('🔍 HomeScreen: Loading more items at offset:', offset);

      const result = await listingsService.getListings({
        limit: PAGE_SIZE,
        offset: offset,
      });

      console.log('🔍 HomeScreen: Loaded', result.items.length, 'more items');

      // 🔥 去重：防止重复的商品ID导致 FlatList key 冲突
      setFeaturedItems(prev => {
        const existingIds = new Set(prev.map(item => item.id));
        const newItems = result.items.filter(item => !existingIds.has(item.id));
        console.log('🔍 HomeScreen: After dedup, adding', newItems.length, 'new items');
        return [...prev, ...newItems];
      });
      setHasMore(result.hasMore);
      setOffset(prev => prev + PAGE_SIZE);
    } catch (err) {
      console.error('Error loading more items:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, loading, isAuthenticated, offset]);

  useEffect(() => {
    if (isAuthenticated) {
      loadFeaturedItems();
    } else {
      // 未登录时重置状态，避免界面显示旧数据
      setFeaturedItems([]);
      setLoading(false);
      setError(null);
    }
  }, [isAuthenticated, loadFeaturedItems]);

  const refreshTrigger = route.params?.refreshTS;
  const scrollToTopTrigger = route.params?.scrollToTopTS;
  const tabPressTrigger = route.params?.tabPressTS;

  useEffect(() => {
    // 移除自动刷新逻辑，回到页面不再自动刷新 featuredItems
  }, [loadFeaturedItems]);

  // 单击 Tab：若在顶部则刷新，否则丝滑回顶
  useEffect(() => {
    if (tabPressTrigger) {
      const atTop = (scrollOffsetRef.current || 0) <= 2;
      if (atTop) {
        loadFeaturedItems({ isRefresh: true });
      } else {
        // FlatList uses scrollToOffset
        scrollRef.current?.scrollToOffset?.({ offset: 0, animated: true });
      }
      navigation.setParams({ tabPressTS: undefined });
    }
  }, [tabPressTrigger]);

  // 丝滑回到顶部
  useEffect(() => {
    if (scrollToTopTrigger) {
      scrollRef.current?.scrollToOffset?.({ offset: 0, animated: true });
      navigation.setParams({ scrollToTopTS: undefined });
    }
  }, [scrollToTopTrigger]);

  // Tab 单击滚到顶部（确保 ref 绑定到 FlatList）
  useScrollToTop(scrollRef);

  // 🔥 使用 useMemo 缓存 ListHeaderComponent，防止每次输入都重新渲染
  const listHeader = React.useMemo(() => (
          <View>
            {/* 🔍 搜索栏 */}
            <View style={styles.searchRow}>
              <TextInput
                ref={searchInputRef}
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
                onPress={() => {
                  // 🔥 获取 MainTabs 导航器并导航到 My TOP tab
                  navigation
                    .getParent<BottomTabNavigationProp<MainTabParamList>>()
                    ?.navigate("My TOP", {
                      screen: "MyTopMain",
                      params: { initialTab: "Likes" },
                    });
                }}
              >
                <Icon name="heart-outline" size={24} color="#111" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ marginLeft: 12 }}
                accessibilityRole="button"
                onPress={() =>
                  // Navigate to Bag screen without passing items parameter
                  // This will load cart items from API
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

            {/* 👕 推荐区标题 */}
            <Text style={styles.sectionTitle}>Suggested for you</Text>
            
            {/* Loading or Error states */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading items...</Text>
              </View>
            )}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    loadFeaturedItems();
                  }}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
  ), [searchText, navigation, loading, error, loadFeaturedItems]); // 🔥 只在这些值改变时重新渲染

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <FlatList
        ref={scrollRef as any}
        onScroll={(e) => {
          scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        style={styles.container}
        data={featuredItems}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadFeaturedItems({ isRefresh: true })}
          />
        }
        ListHeaderComponent={listHeader}
        ListFooterComponent={() => {
          if (isLoadingMore) {
            return (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Loading more...</Text>
              </View>
            );
          }
          if (!hasMore && featuredItems.length > 0) {
            return (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#999', fontSize: 14 }}>You've reached the end</Text>
              </View>
            );
          }
          return <View style={{ height: 60 }} />;
        }}
        renderItem={({ item }) => {
          const primaryImage =
            (Array.isArray(item.images) && item.images[0]) ||
            "https://via.placeholder.com/300x300/f4f4f4/999999?text=No+Image";

          return (
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() =>
                (navigation as any)
                  .getParent()
                  ?.getParent()
                  ?.navigate("Buy", {
                    screen: "ListingDetail",
                    params: { listingId: item.id },
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
        }}
      />
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
  gridContainer: {
    paddingHorizontal: 0,
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 0,
  },
  gridItem: {
    width: "48%",
    marginBottom: 16,
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
