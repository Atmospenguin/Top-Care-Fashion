// mobile/screens/main/HomeStack/HomeScreen.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, RefreshControl, FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useNavigation, useRoute, useScrollToTop,
  type NavigatorScreenParams, type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

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
  const seedRef = useRef<number>((Date.now() % INT32_MAX) | 0);

  const [searchText, setSearchText] = useState("");
  const [featuredItems, setFeaturedItems] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 🔵 NEW: track active mode
  const [mode, setMode] = useState<"foryou" | "trending">("foryou");

  // 🔐 Auth
  const auth = useAuth() as any;
  const isAuthenticated: boolean = !!auth?.isAuthenticated;
  const accessToken: string | undefined =
    auth?.accessToken ??
    auth?.session?.access_token ??
    auth?.session?.accessToken ??
    (globalThis as any).__SUPABASE_TOKEN;

  const authReady: boolean =
    (typeof auth?.initialized === "boolean" ? auth.initialized : undefined) ??
    (typeof auth?.isAuthenticated === "boolean");

  // ---------- helpers ----------
  const buildFeedUrl = useCallback(
    (opts: { page: number; seedId: number; noStore?: boolean }) => {
      const base = API_BASE_URL.replace(/\/+$/, "");
      const u = new URL(`${base}/api/feed/home`);
      u.searchParams.set("mode", mode); // 🔵 changed
      u.searchParams.set("limit", String(PAGE_SIZE));
      u.searchParams.set("page", String(opts.page));
      u.searchParams.set("seedId", String(opts.seedId));
      if (opts.noStore) {
        u.searchParams.set("noStore", "1");
        u.searchParams.set("cacheBust", String(Date.now()));
      }
      const url = u.toString();
      if (__DEV__) console.info("[HomeScreen] url:", url);
      return url;
    },
    [mode]
  );

  const mapApiItem = (x: any): ListingItem => {
  const idNum = typeof x.id === "number" ? x.id : Number(x.id);
  const cents = typeof x.price_cents === "number" ? x.price_cents : Number(x.price_cents ?? 0);
  const price = Number.isFinite(cents) ? cents / 100 : 0;
  const images = x.image_url ? [String(x.image_url)] : [];
  const title = String(x.title ?? "");
  const tags = Array.isArray(x.tags) ? x.tags.map(String) : [];

  return {
    id: String(idNum),
    title,
    price,
    images,
    size: x.size ?? null,
    material: x.material ?? null,
    tags,
    brand: x.brand ?? null,

    // 🟢 add default fallbacks for missing ListingItem props
    description: x.description ?? "",
    condition: x.condition ?? "Good",
    // Construct seller object (feed API doesn't return seller info, so use defaults)
    seller: typeof x.seller === "object" && x.seller !== null
      ? {
          id: x.seller.id ?? 0,
          name: x.seller.name ?? "Seller",
          avatar: x.seller.avatar ?? "",
          rating: x.seller.rating ?? 5.0,
          sales: x.seller.sales ?? 0,
          isPremium: x.seller.isPremium ?? false,
        }
      : {
          id: 0,
          name: "Seller",
          avatar: "",
          rating: 5.0,
          sales: 0,
          isPremium: false,
        },
  };
};

  const dedupe = (arr: ListingItem[]) => {
    const seen = new Set<string>();
    return arr.filter((it) => {
      const id = String(it.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  };

  const fetchFeedPage = useCallback(
    async (pageToLoad: number, { bypassCache = false } = {}) => {
      const url = buildFeedUrl({ page: pageToLoad, seedId: seedRef.current, noStore: bypassCache });
      const headers: Record<string, string> = { Accept: "application/json" };
      if (isAuthenticated && accessToken) headers.Authorization = `Bearer ${accessToken}`;
      if (bypassCache) headers["Cache-Control"] = "no-store";

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`Feed HTTP ${res.status}`);
      const json = await res.json();
      const items = Array.isArray(json.items) ? json.items.map(mapApiItem) : [];
      return { items, hasMore: items.length === PAGE_SIZE };
    },
    [buildFeedUrl, isAuthenticated, accessToken]
  );

  // ---------- load ----------
  const loadInitial = useCallback(async () => {
    if (!authReady) return;
    setLoading(true);
    setError(null);
    try {
      const { items, hasMore } = await fetchFeedPage(1, { bypassCache: true });
      setFeaturedItems(dedupe(items));
      setHasMore(hasMore);
      setPage(1);
    } catch (e: any) {
      setError(e.message || "Failed to load");
      setFeaturedItems([]);
    } finally {
      setLoading(false);
    }
  }, [authReady, fetchFeedPage]);

  useEffect(() => { loadInitial(); }, [loadInitial, mode]); // 🔵 reload when mode changes

  const refresh = useCallback(async () => {
    setRefreshing(true);
    seedRef.current = (Date.now() % INT32_MAX) | 0;
    await loadInitial();
    setRefreshing(false);
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || loading) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { items } = await fetchFeedPage(nextPage);
      setFeaturedItems((prev) => dedupe([...prev, ...items]));
      setPage(nextPage);
      if (items.length < PAGE_SIZE) setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, loading, page, fetchFeedPage]);

  useScrollToTop(scrollRef);

  // ---------- navigation handler ----------
  const handleListingPress = useCallback(
    (item: ListingItem) => {
      if (!item || !item.id) {
        console.warn("⚠️ Cannot navigate: invalid listing item");
        return;
      }

      // Navigate to root level, then to Buy stack -> ListingDetail
      // Find root navigation by traversing up the navigation hierarchy
      let rootNavigation: any = navigation;
      let current: any = navigation;
      while (current?.getParent?.()) {
        current = current.getParent();
        if (current) {
          rootNavigation = current;
        }
      }

      // ✅ Use lazy loading: only pass listingId, let ListingDetailScreen fetch full data
      // This ensures we get complete, up-to-date data from the API (including seller info, etc.)
      const listingId = String(item.id);
      console.log("🔍 Navigating to ListingDetail with lazy loading, listingId:", listingId);
      requestAnimationFrame(() => {
        rootNavigation?.navigate("Buy", {
          screen: "ListingDetail",
          params: { listingId },
        });
      });
    },
    [navigation]
  );

  // ---------- header ----------
  const listHeader = useMemo(
    () => (
      <View>
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <TextInput
            ref={searchInputRef}
            style={styles.searchBar}
            placeholder="Search for anything"
            placeholderTextColor="#666"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
        </View>

        {/* Premium Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Style smarter with AI Mix & Match</Text>
          <Text style={styles.bannerSubtitle}>
            Unlimited styling, free boosts, lower fees
          </Text>
        </View>

        {/* 🔵 Mode Toggle Buttons */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === "foryou" && styles.toggleBtnActive]}
            onPress={() => setMode("foryou")}
          >
            <Text style={[styles.toggleText, mode === "foryou" && styles.toggleTextActive]}>
              For You
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === "trending" && styles.toggleBtnActive]}
            onPress={() => setMode("trending")}
          >
            <Text style={[styles.toggleText, mode === "trending" && styles.toggleTextActive]}>
              Trending
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>
          {mode === "foryou" ? "Suggested for you" : "Trending now"}
        </Text>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Loading items...</Text>
          </View>
        )}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    ),
    [searchText, mode, loading, error]
  );

  // ---------- render ----------
  const emptyState =
    !loading && !error && featuredItems.length === 0 ? (
      <View style={{ padding: 32, alignItems: "center" }}>
        <Text style={{ fontSize: 15, color: "#666", textAlign: "center" }}>
          {mode === "foryou"
            ? "No suggestions yet. Try pulling to refresh."
            : "No trending items available."}
        </Text>
      </View>
    ) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <FlatList
        ref={scrollRef as any}
        data={featuredItems}
        numColumns={2}
        keyExtractor={(item) => String(item.id)}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyState}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => {
          if (isLoadingMore) {
            return (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={{ marginTop: 8, color: "#666", fontSize: 14 }}>
                  Loading more...
                </Text>
              </View>
            );
          }

          if (!hasMore && featuredItems.length > 0) {
            const displayCount = featuredItems.length;
            return (
              <View style={styles.footerContainer}>
                <View style={styles.footerDivider} />
                <Text style={styles.footerText}>
                  You've reached the end • {displayCount} {displayCount === 1 ? "item" : "items"} found
                </Text>
                <Text style={styles.footerSubtext}>
                  {mode === "foryou" 
                    ? "Pull to refresh for new suggestions" 
                    : "Pull to refresh for more trending items"}
                </Text>
              </View>
            );
          }

          return null;
        }}
        // 👇 force rerender of list rows when seed or mode changes
        extraData={`${seedRef.current}-${mode}-${featuredItems.length}`}
        renderItem={({ item }) => {
          const primaryImage =
            item.images?.[0] ??
            "https://via.placeholder.com/300x300/f4f4f4/999999?text=No+Image";
          const displayTags = item.tags && item.tags.length > 0 ? item.tags.slice(0, 2) : [];
          return (
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => handleListingPress(item)}
              activeOpacity={0.7}
            >
              <Image source={{ uri: primaryImage }} style={styles.gridImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                {displayTags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {displayTags.map((tag, index) => (
                      <View key={index} style={styles.tagChip}>
                        <Text style={styles.tagText} numberOfLines={1}>{tag}</Text>
                      </View>
                    ))}
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
  container: { flex: 1, backgroundColor: "#fff" },
  searchRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, paddingHorizontal: 16 },
  searchBar: {
    flex: 1, height: 44, borderRadius: 22, backgroundColor: "#f3f3f3",
    paddingHorizontal: 16, fontSize: 15,
  },
  banner: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 20 },
  bannerTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  bannerSubtitle: { fontSize: 14, color: "#555" },

  // 🔵 Toggle Buttons
  toggleRow: { flexDirection: "row", justifyContent: "center", marginBottom: 16 },
  toggleBtn: {
    flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: "#ddd", marginHorizontal: 8,
  },
  toggleBtnActive: { backgroundColor: "#000" },
  toggleText: { color: "#111", fontWeight: "600" },
  toggleTextActive: { color: "#fff" },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginHorizontal: 16, marginBottom: 12 },
  gridContainer: { paddingHorizontal: 16 },
  row: { justifyContent: "space-between" },
  gridItem: { width: "48%", marginBottom: 16, borderRadius: 12, overflow: "hidden", backgroundColor: "#f9f9f9" },
  gridImage: { width: "100%", aspectRatio: 1 },
  itemInfo: { padding: 10 },
  itemTitle: { fontSize: 14, fontWeight: "600", color: "#111", marginBottom: 4 },
  itemPrice: { fontSize: 15, fontWeight: "700", color: "#111", marginBottom: 6 },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  tagChip: {
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    maxWidth: "100%",
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
  },

  loadingContainer: { alignItems: "center", paddingVertical: 40 },
  loadingText: { marginTop: 10, fontSize: 14, color: "#666" },
  errorContainer: { alignItems: "center", paddingVertical: 40 },
  errorText: { color: "#FF3B30" },
  footerContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 32,
    rowGap: 8,
  },
  footerDivider: {
    width: 60,
    height: 3,
    backgroundColor: "#e5e5e5",
    borderRadius: 999,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
  },
  footerSubtext: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    marginTop: 4,
  },
});
