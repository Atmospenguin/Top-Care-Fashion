import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useNavigation,
  useRoute,
  useScrollToTop,
  type NavigatorScreenParams,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { RouteProp } from "@react-navigation/native";

import Icon from "../../../components/Icon";
import type { HomeStackParamList } from "./index";
import type { RootStackParamList } from "../../../App";
import type { MyTopStackParamList } from "../MyTopStack";
import type { ListingItem } from "../../../types/shop";
import { useAuth } from "../../../contexts/AuthContext";

// ✅ bring in your API base if you have it; otherwise hardcode your dev URL
import { API_BASE_URL } from "../../../src/config/api";

type MainTabParamList = {
  Home: undefined;
  Discover: undefined;
  Sell: undefined;
  Inbox: undefined;
  "My TOP": NavigatorScreenParams<MyTopStackParamList> | undefined;
};

const PAGE_SIZE = 20;
const INT32_MAX = 2_147_483_647;

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, "HomeMain">>();

  const scrollRef = useRef<FlatList<ListingItem> | null>(null);
  const scrollOffsetRef = useRef(0);
  const searchInputRef = useRef<TextInput>(null);

  // 🔑 seed that drives DB tie-breaks; rerender list when it changes
  const seedRef = useRef<number>((Date.now() % INT32_MAX) | 0);

  const [searchText, setSearchText] = useState("");
  const [featuredItems, setFeaturedItems] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { isAuthenticated } = useAuth();

  // -------- helpers --------
  const buildFeedUrl = useCallback(
    (opts: { page: number; seedId: number; noStore?: boolean }) => {
      const u = new URL(`${API_BASE_URL.replace(/\/+$/, "")}/api/feed/home`);
      u.searchParams.set("limit", String(PAGE_SIZE));
      u.searchParams.set("page", String(opts.page));
      u.searchParams.set("seedId", String(opts.seedId));
      // during refresh/first load we bypass cache to see new order
      if (opts.noStore) {
        u.searchParams.set("noStore", "1");
        u.searchParams.set("cacheBust", String(Date.now()));
      }
      return u.toString();
    },
    []
  );

  // Map API item → ListingItem (keep id as STRING to match your type)
  const mapApiItem = (x: any): ListingItem => {
    const idNum = typeof x.id === "number" ? x.id : Number(x.id);
    const cents = typeof x.price_cents === "number" ? x.price_cents : Number(x.price_cents ?? 0);
    const price = Number.isFinite(cents) ? cents / 100 : 0;

    const images = x.image_url ? [String(x.image_url)] : [];
    const title = String(x.title ?? "");
    const tags = Array.isArray(x.tags) ? x.tags.map(String) : [];

    return {
      id: String(idNum), // ✅ keep as string to match ListingItem
      title,
      price, // number for math/formatting
      images,
      size: x.size ?? null,
      material: x.material ?? null,
      tags,
      brand: x.brand ?? null,
    } as ListingItem;
  };

  // De-dupe with string keys (since id is string)
  const dedupe = (arr: ListingItem[]) => {
    const seen = new Set<string>();
    const out: ListingItem[] = [];
    for (const it of arr) {
      const key = String(it.id);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(it);
      }
    }
    return out;
  };

  // Core fetcher
  const fetchFeedPage = useCallback(
    async (pageToLoad: number, { bypassCache = false } = {}) => {
      const url = buildFeedUrl({
        page: pageToLoad,
        seedId: seedRef.current,
        noStore: bypassCache,
      });
      if (__DEV__) console.info("[HomeScreen] GET", url);
      const res = await fetch(url, {
        headers: bypassCache ? { "Cache-Control": "no-store" } : undefined,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Feed HTTP ${res.status} ${text}`);
      }
      const json = await res.json();
const items: ListingItem[] = Array.isArray(json.items)
  ? (json.items as any[]).map(mapApiItem)
  : [];
const nextHasMore = items.length === PAGE_SIZE; // simple heuristic

      if (__DEV__) {
        console.info(
          `[HomeScreen] page=${pageToLoad} seed=${seedRef.current} ids:`,
          items.slice(0, 5).map((i) => i.id)
        );
      }
      return { items, hasMore: nextHasMore };
    },
    [buildFeedUrl]
  );

  // -------- initial load / auth gate --------
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!isAuthenticated) {
        setFeaturedItems([]);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // bypass cache so first load reflects current seed
        const { items, hasMore } = await fetchFeedPage(1, { bypassCache: true });
        if (cancelled) return;
        setFeaturedItems(dedupe(items));
        setHasMore(hasMore);
        setPage(1);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load items");
        setFeaturedItems([]);
        setHasMore(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, fetchFeedPage]);

  // -------- refresh / loadMore --------
  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setRefreshing(true);
    setError(null);
    try {
      // new seed → different deterministic tie-break
      seedRef.current = (Date.now() % INT32_MAX) | 0;
      const { items, hasMore } = await fetchFeedPage(1, { bypassCache: true });
      setFeaturedItems(dedupe(items));
      setHasMore(hasMore);
      setPage(1);
    } catch (e: any) {
      setError(e?.message ?? "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }, [isAuthenticated, fetchFeedPage]);

  const loadMore = useCallback(async () => {
    if (!isAuthenticated || !hasMore || isLoadingMore || loading) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { items } = await fetchFeedPage(nextPage, { bypassCache: false });
      setFeaturedItems((prev) => dedupe([...prev, ...items]));
      setPage(nextPage);
      // keep hasMore heuristic: if we got a full page, assume more
      if (items.length < PAGE_SIZE) setHasMore(false);
    } catch {
      // quiet fail for infinite scroll
    } finally {
      setIsLoadingMore(false);
    }
  }, [isAuthenticated, hasMore, isLoadingMore, loading, page, fetchFeedPage]);

  // -------- tab interactions --------
  const refreshTrigger = route.params?.refreshTS;
  const scrollToTopTrigger = route.params?.scrollToTopTS;
  const tabPressTrigger = route.params?.tabPressTS;

  // Single-tap Tab: refresh if at top, else smooth scroll to top
  useEffect(() => {
    if (tabPressTrigger) {
      const atTop = (scrollOffsetRef.current || 0) <= 2;
      if (atTop) refresh();
      else scrollRef.current?.scrollToOffset?.({ offset: 0, animated: true });
      navigation.setParams({ tabPressTS: undefined });
    }
  }, [tabPressTrigger, refresh, navigation]);

  // Smooth scroll to top
  useEffect(() => {
    if (scrollToTopTrigger) {
      scrollRef.current?.scrollToOffset?.({ offset: 0, animated: true });
      navigation.setParams({ scrollToTopTS: undefined });
    }
  }, [scrollToTopTrigger, navigation]);

  useScrollToTop(scrollRef);

  // -------- header (memoized) --------
  const listHeader = useMemo(
    () => (
      <View>
        {/* Search */}
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
              const parent = navigation.getParent()?.getParent();
              parent?.navigate("Buy", {
                screen: "SearchResult",
                params: { query: searchText || "" },
              });
            }}
          />
          <TouchableOpacity
            style={{ marginLeft: 12 }}
            accessibilityRole="button"
            onPress={() => {
              navigation
                .getParent<BottomTabNavigationProp<MainTabParamList>>()
                ?.navigate("My TOP", { screen: "MyTopMain", params: { initialTab: "Likes" } });
            }}
          >
            <Icon name="heart-outline" size={24} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginLeft: 12 }}
            accessibilityRole="button"
            onPress={() =>
              (navigation as any)
                .getParent()
                ?.getParent()
                ?.navigate("Buy", { screen: "Bag" } as any)
            }
          >
            <Icon name="bag-outline" size={24} color="#111" />
          </TouchableOpacity>
        </View>

        {/* Premium Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Style smarter with AI Mix & Match</Text>
          <Text style={styles.bannerSubtitle}>
            Unlimited Mix & Match Styling{"\n"}Reduced commission fees & Free boosts
          </Text>
          <TouchableOpacity
            style={styles.premiumBtn}
            onPress={() => {
              const rootNavigation = navigation.getParent()?.getParent() as
                | NativeStackNavigationProp<RootStackParamList>
                | undefined;
              rootNavigation?.navigate("Premium", { screen: "PremiumPlans" });
            }}
          >
            <Text style={styles.premiumText}>Get Premium</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Suggested for you</Text>

        {/* Loading / Error */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading items...</Text>
          </View>
        )}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refresh}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    ),
    [searchText, navigation, loading, error, refresh]
  );

  // -------- render --------
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
        keyExtractor={(item) => String(item.id)}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListHeaderComponent={listHeader}
        ListFooterComponent={() => {
          if (isLoadingMore) {
            return (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Loading more...</Text>
              </View>
            );
          }
          if (!hasMore && featuredItems.length > 0) {
            return (
              <View style={{ padding: 20, alignItems: "center" }}>
                <Text style={{ color: "#999", fontSize: 14 }}>You've reached the end</Text>
              </View>
            );
          }
          return <View style={{ height: 60 }} />;
        }}
        // 👇 force rerender of list rows when seed changes
        extraData={seedRef.current}
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
                    params: { listingId: Number(item.id) }, // ✅ cast only where number is required
                  } as any)
              }
              accessibilityRole="button"
            >
              <Image source={{ uri: primaryImage }} style={styles.gridImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.itemPrice}>${Number(item.price ?? 0).toFixed(2)}</Text>
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
                    {item.tags.slice(0, 2).map((tag: any, index: number) => (
                      <View key={index} style={styles.itemTagChip}>
                        <Text style={styles.itemTagText}>{String(tag)}</Text>
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
  searchRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
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
  gridContainer: { paddingHorizontal: 0 },
  row: { justifyContent: "space-between", paddingHorizontal: 0 },
  gridItem: {
    width: "48%",
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ededed",
  },
  gridImage: { width: "100%", aspectRatio: 1, backgroundColor: "#f1f1f1" },
  itemInfo: { padding: 10, rowGap: 4 },
  itemTitle: { fontSize: 14, fontWeight: "600", color: "#111" },
  itemPrice: { fontSize: 15, fontWeight: "700", color: "#111" },
  itemSize: { fontSize: 12, color: "#666" },
  itemMaterial: { fontSize: 11, color: "#888", marginTop: 2, fontStyle: "italic" },
  itemTags: { flexDirection: "row", flexWrap: "wrap", marginTop: 4, gap: 4 },
  itemTagChip: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
  },
  itemTagText: { fontSize: 10, color: "#666", fontWeight: "500" },
  itemTagMore: { fontSize: 10, color: "#999", fontStyle: "italic", alignSelf: "center" },

  // states
  loadingContainer: { alignItems: "center", paddingVertical: 40 },
  loadingText: { marginTop: 10, fontSize: 14, color: "#666" },
  errorContainer: { alignItems: "center", paddingVertical: 40 },
  errorText: { fontSize: 14, color: "#FF3B30", textAlign: "center", marginBottom: 10 },
  retryButton: { backgroundColor: "#007AFF", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: "#fff", fontWeight: "600" },
});
