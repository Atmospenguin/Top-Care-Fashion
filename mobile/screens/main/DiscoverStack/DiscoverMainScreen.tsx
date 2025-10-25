import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "../../../components/Icon";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BuyStackParamList } from "../BuyStack/index";

import type { MyTopStackParamList } from "../MyTopStack";
import type { DiscoverStackParamList } from "./index";
import { listingsService } from "../../../src/services/listingsService";
import type { BrandSummary } from "../../../src/services/listingsService";
import { userService } from "../../../src/services/userService";
import type { RouteProp } from "@react-navigation/native";

type MainTabParamList = {
  Home: undefined;
  Discover: undefined;
  Sell: undefined;
  Inbox: undefined;
  "My TOP": NavigatorScreenParams<MyTopStackParamList> | undefined;
  Buy: NavigatorScreenParams<BuyStackParamList> | undefined;
};

type DiscoverNavigation = NativeStackNavigationProp<DiscoverStackParamList>;
type DiscoverRoute = RouteProp<DiscoverStackParamList, "DiscoverMain">;

const CATEGORY_OPTIONS: Array<{ label: string; value: "men" | "women" | "unisex" }> = [
  { label: "Men", value: "men" },
  { label: "Women", value: "women" },
  { label: "Unisex", value: "unisex" },
];

const DEFAULT_BRAND_NAMES = [
  "Nike",
  "Zara",
  "Adidas",
  "Dr. Martens",
  "Levi's",
  "Gucci",
  "Off-White",
  "ASOS",
  "Brandy Melville",
  "Chanel",
];

const toBrandSummaries = (names: string[]): BrandSummary[] =>
  names
    .map((name) => (typeof name === "string" ? name.trim() : ""))
    .filter((name): name is string => Boolean(name))
    .map((name) => ({ name, listingsCount: 0 }));

export default function DiscoverMainScreen() {
  const navigation = useNavigation<DiscoverNavigation>();
  const route = useRoute<DiscoverRoute>();
  const [searchText, setSearchText] = useState<string>("");
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState<string | null>(null);
  const [preferredBrands, setPreferredBrands] = useState<string[]>([]);

  const loadBrands = useCallback(async () => {
    try {
      setBrandsLoading(true);
      setBrandsError(null);

      const fetched = await listingsService.getBrandSummaries({ limit: 24 });
      const summaries = fetched.filter((item) => item.name && item.name.trim().length > 0);

      if (summaries.length > 0) {
        setBrands(summaries);
      } else {
        setBrands(toBrandSummaries(DEFAULT_BRAND_NAMES));
      }
    } catch (error) {
      console.error("Error loading brands:", error);
      setBrandsError("Failed to load brands. Tap to retry.");
      setBrands(toBrandSummaries(DEFAULT_BRAND_NAMES));
    } finally {
      setBrandsLoading(false);
    }
  }, []);

  const loadPreferred = useCallback(async () => {
    try {
      const profile = await userService.getProfile();
      const arr = Array.isArray((profile as any)?.preferred_brands)
        ? ((profile as any).preferred_brands as unknown[])
        : [];
      const list = arr
        .filter((x): x is string => typeof x === "string")
        .map((s) => s.trim())
        .filter(Boolean);
      setPreferredBrands(list);
    } catch (e) {
      setPreferredBrands([]);
    }
  }, []);

  useEffect(() => {
    // 初次加载仅加载品牌，偏好在获得焦点时加载，避免重复
    loadBrands();
  }, [loadBrands]);

  useFocusEffect(
    useCallback(() => {
      loadPreferred();
      return () => {};
    }, [loadPreferred])
  );

  useEffect(() => {
    if ((route.params as any)?.refreshTS) {
      loadPreferred();
      loadBrands();
    }
  }, [route.params, loadPreferred, loadBrands]);

  const handleBrandPress = useCallback(
    (brand: string) => {
      if (!brand) return;
      const parent = navigation.getParent<BottomTabNavigationProp<MainTabParamList>>();
      parent?.navigate("Buy", {
        screen: "SearchResult",
        params: { query: brand },
      });
    },
    [navigation],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* 搜索栏 */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search for Anything"
        placeholderTextColor="#666"
        value={searchText}
        onChangeText={setSearchText}
        returnKeyType="search"
        onSubmitEditing={() => {
          // Navigate to SearchResult in Buy stack (allow empty string)
          // Use parent/root navigator to reach the Buy stack
          const parent = navigation.getParent();
          parent?.navigate("Buy", { screen: "SearchResult", params: { query: searchText || "" } });
        }}
      />

      {/* 分类 */}
      <Text style={styles.sectionTitle}>Shop by Category</Text>
      {CATEGORY_OPTIONS.map(({ label, value }) => (
        <TouchableOpacity
          key={value}
          style={styles.categoryRow}
          onPress={() =>
            navigation.navigate("DiscoverCategory", {
              gender: value,
            })
          }
        >
          <Text style={styles.categoryText}>{label}</Text>
          <Icon name="chevron-forward" size={18} color="#888" />
        </TouchableOpacity>
      ))}

      {/* 品牌 */}
      <View style={styles.brandHeader}>
        <Text style={styles.sectionTitle}>Brands</Text>
        <TouchableOpacity
          onPress={() =>
            navigation
              .getParent<BottomTabNavigationProp<MainTabParamList>>()
              ?.navigate("My TOP", {
                screen: "EditBrand",
                params: {
                  source: "discover",
                  availableBrands: brands.map((b) => b.name),
                  selectedBrands: preferredBrands,
                },
              })
          }
        >
          <Text style={styles.selectBrands}>Select Brands</Text>
        </TouchableOpacity>
      </View>

      {brandsLoading ? (
        <View style={styles.brandStatus}>
          <ActivityIndicator size="small" color="#5B21B6" />
          <Text style={styles.brandStatusText}>Loading brands...</Text>
        </View>
      ) : (
        <>
          {brandsError && (
            <TouchableOpacity style={styles.brandErrorBox} onPress={() => loadBrands()}>
              <Text style={styles.brandErrorText}>{brandsError}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.brandWrap}>
            {(() => {
              const effective: BrandSummary[] = (() => {
                if (preferredBrands.length > 0) {
                  const map = new Map(brands.map((b) => [b.name.toLowerCase(), b.listingsCount] as const));
                  return preferredBrands.map((name) => ({
                    name,
                    listingsCount: map.get(name.toLowerCase()) ?? 0,
                  }));
                }
                return brands;
              })();

              return effective.length === 0 ? (
                <Text style={styles.brandEmptyText}>No brands available right now.</Text>
              ) : (
                effective.map((brand) => (
                  <TouchableOpacity
                    key={brand.name}
                    style={styles.brandTag}
                    onPress={() => handleBrandPress(brand.name)}
                  >
                    <Text style={styles.brandText}>{brand.name}</Text>
                  </TouchableOpacity>
                ))
              );
            })()}
          </View>
        </>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },

  searchBar: {
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f3f3f3",
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },

  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  categoryText: { fontSize: 15, color: "#111" },

  brandHeader: {
    marginTop: 20,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectBrands: { fontSize: 14, color: "#5B21B6", fontWeight: "600" },

  brandWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  brandStatus: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  brandStatusText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#666",
  },
  brandErrorBox: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  brandErrorText: {
    fontSize: 13,
    color: "#B91C1C",
  },
  brandEmptyText: {
    fontSize: 13,
    color: "#666",
  },
  brandTag: {
    backgroundColor: "#111",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  brandText: { color: "#fff", fontSize: 14, fontWeight: "500" },
});
