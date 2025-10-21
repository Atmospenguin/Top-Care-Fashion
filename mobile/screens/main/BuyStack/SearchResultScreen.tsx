import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import FilterModal from "../../../components/FilterModal";
import { fetchListings } from "../../../api";
import type { ListingItem } from "../../../types/shop";
import type { BuyStackParamList } from "./index";

type SearchResultRoute = RouteProp<BuyStackParamList, "SearchResult">;
type BuyNavigation = NativeStackNavigationProp<BuyStackParamList>;

const MAIN_CATEGORIES = ["All", "Tops", "Bottoms", "Outerwear", "Footwear", "Accessories"] as const;
const SIZES = ["All", "My Size", "XS", "S", "M", "L", "XL", "XXL"] as const;
const CONDITIONS = ["All", "New", "Like New", "Good", "Fair"] as const;
const SORT_OPTIONS = ["Latest", "Price Low to High", "Price High to Low"] as const;

export default function SearchResultScreen() {
  const navigation = useNavigation<BuyNavigation>();
  const {
    params: { query },
  } = useRoute<SearchResultRoute>();

  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Applied filters (used for actual filtering)
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSize, setSelectedSize] = useState<string>("All");
  const [selectedCondition, setSelectedCondition] = useState<string>("All");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<typeof SORT_OPTIONS[number]>("Latest");

  // Temporary filters (used in modal, applied on button click)
  const [tempCategory, setTempCategory] = useState<string>("All");
  const [tempSize, setTempSize] = useState<string>("All");
  const [tempCondition, setTempCondition] = useState<string>("All");
  const [tempMinPrice, setTempMinPrice] = useState<string>("");
  const [tempMaxPrice, setTempMaxPrice] = useState<string>("");
  const [tempSortBy, setTempSortBy] = useState<typeof SORT_OPTIONS[number]>("Latest");

  // Scroll animation state
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const [headerVisible, setHeaderVisible] = useState(true);

  const [apiListings, setApiListings] = useState<ListingItem[]>([]);

  useEffect(() => {
    let mounted = true;
    fetchListings()
      .then((items) => {
        if (!mounted) return;
        // items should be ListingItem[] shape; if not, map minimally
        setApiListings(
          (items || []).map((it: any) => ({
            id: String(it.id ?? it._id ?? Math.random().toString(36).slice(2)),
            title: String(it.title ?? "Untitled"),
            price: Number(it.price ?? 0),
            size: String(it.size ?? "M"),
            condition: String(it.condition ?? "Good"),
            category: String(it.category ?? "top"),
            images: Array.isArray(it.images) && it.images.length > 0 ? it.images : [
              typeof it.image === "string" ? it.image : "https://via.placeholder.com/512"
            ],
            seller: it.seller ?? { id: "api", name: "Seller" },
            location: it.location ?? "",
          })) as ListingItem[]
        );
      })
      .catch(() => setApiListings([]));
    return () => {
      mounted = false;
    };
  }, []);

  const sourceListings = apiListings;

  const filteredListings = useMemo(() => {
    let results = sourceListings.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );

    if (selectedCategory !== "All") {
      results = results.filter((item) => {
        const categoryLower = selectedCategory.toLowerCase();
        if (categoryLower === "tops") return item.category === "top";
        if (categoryLower === "bottoms") return item.category === "bottom";
        if (categoryLower === "footwear") return item.category === "shoe";
        if (categoryLower === "accessories") return item.category === "accessory";
        return true;
      });
    }

    if (selectedSize !== "All") {
      if (selectedSize === "My Size") {
        // TODO: Get user's preferred size from user settings/preferences
        const userPreferredSize = "M"; // Default to M for now
        results = results.filter((item) => item.size === userPreferredSize);
      } else {
        results = results.filter((item) => item.size === selectedSize);
      }
    }

    if (selectedCondition !== "All") {
      results = results.filter((item) => item.condition === selectedCondition);
    }

    // Apply custom price range
    const min = minPrice ? parseFloat(minPrice) : 0;
    const max = maxPrice ? parseFloat(maxPrice) : Infinity;
    if (minPrice || maxPrice) {
      results = results.filter((item) => item.price >= min && item.price <= max);
    }

    // Apply sorting
    if (sortBy === "Price Low to High") {
      results = [...results].sort((a, b) => a.price - b.price);
    } else if (sortBy === "Price High to Low") {
      results = [...results].sort((a, b) => b.price - a.price);
    }
    // Latest is the default order

    return results;
  }, [query, selectedCategory, selectedSize, selectedCondition, minPrice, maxPrice, sortBy, sourceListings]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "All") count++;
    if (selectedSize !== "All") count++;
    if (selectedCondition !== "All") count++;
    if (minPrice || maxPrice) count++;
    if (sortBy !== "Latest") count++;
    return count;
  }, [selectedCategory, selectedSize, selectedCondition, minPrice, maxPrice, sortBy]);

  const handleOpenFilters = () => {
    // Sync temp filters with current applied filters
    setTempCategory(selectedCategory);
    setTempSize(selectedSize);
    setTempCondition(selectedCondition);
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setTempSortBy(sortBy);
    setFilterModalVisible(true);
  };

  const handleClearFilters = () => {
    setTempCategory("All");
    setTempSize("All");
    setTempCondition("All");
    setTempMinPrice("");
    setTempMaxPrice("");
    setTempSortBy("Latest");
  };

  const handleApplyFilters = () => {
    setSelectedCategory(tempCategory);
    setSelectedSize(tempSize);
    setSelectedCondition(tempCondition);
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setSortBy(tempSortBy);
    setFilterModalVisible(false);
  };

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    
    // If at the top, always show header
    if (currentScrollY <= 0) {
      if (!headerVisible) {
        setHeaderVisible(true);
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
      lastScrollY.current = currentScrollY;
      return;
    }

    // Scrolling down -> hide header with animation
    if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
      if (headerVisible) {
        setHeaderVisible(false);
        Animated.timing(headerTranslateY, {
          toValue: -200, // Slide up and hide
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }
    // Scrolling up -> show header with animation
    else if (currentScrollY < lastScrollY.current) {
      if (!headerVisible) {
        setHeaderVisible(true);
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }

    lastScrollY.current = currentScrollY;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Animated.View
        style={{
          transform: [{ translateY: headerTranslateY }],
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          backgroundColor: "#fff",
        }}
      >
        <Header title={`"${query}"`} showBack />

        <View style={styles.filterBar}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={handleOpenFilters}
          >
            <Icon name="options-outline" size={18} color="#111" />
            <Text style={styles.filterButtonText}>Filter</Text>
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.resultCount}>{filteredListings.length} results</Text>
        </View>
      </Animated.View>

      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate("ListingDetail", { item })}
          >
            <Image source={{ uri: item.images[0] }} style={styles.gridImage} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
              <Text style={styles.itemSize} numberOfLines={1}>
                Size {item.size}
              </Text>
              {item.material && (
                <Text style={styles.itemMaterial} numberOfLines={1}>
                  {item.material}
                </Text>
              )}
              {item.tags && item.tags.length > 0 && (
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
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="search-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your filters or search terms
            </Text>
          </View>
        }
        ListFooterComponent={
          filteredListings.length > 0 ? (
            <View style={styles.footerContainer}>
              <View style={styles.footerDivider} />
              <Text style={styles.footerText}>
                You've reached the end • {filteredListings.length} {filteredListings.length === 1 ? 'item' : 'items'} found
              </Text>
              <Text style={styles.footerSubtext}>
                Try adjusting your filters to see more results
              </Text>
            </View>
          ) : null
        }
      />

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        sections={[
          {
            key: "category",
            title: "Category",
            options: MAIN_CATEGORIES.map((category) => ({
              label: category,
              value: category,
            })),
            selectedValue: tempCategory,
            onSelect: (value) => setTempCategory(String(value)),
          },
          {
            key: "size",
            title: "Size",
            options: SIZES.map((size) => ({
              label: size,
              value: size,
            })),
            selectedValue: tempSize,
            onSelect: (value) => setTempSize(String(value)),
          },
          {
            key: "condition",
            title: "Condition",
            options: CONDITIONS.map((condition) => ({
              label: condition,
              value: condition,
            })),
            selectedValue: tempCondition,
            onSelect: (value) => setTempCondition(String(value)),
          },
          {
            key: "priceRange",
            title: "Price Range",
            type: "range",
            minValue: parseFloat(tempMinPrice) || 0,
            maxValue: parseFloat(tempMaxPrice) || 0,
            minPlaceholder: "$0",
            maxPlaceholder: "$1000+",
            onMinChange: setTempMinPrice,
            onMaxChange: setTempMaxPrice,
          },
          {
            key: "sortBy",
            title: "Sort By",
            options: SORT_OPTIONS.map((option) => ({
              label: option,
              value: option,
            })),
            selectedValue: tempSortBy,
            onSelect: (value) => setTempSortBy(String(value) as typeof SORT_OPTIONS[number]),
          },
        ]}
        onClose={() => setFilterModalVisible(false)}
        onClear={handleClearFilters}
        onApply={handleApplyFilters}
        applyButtonLabel={`Apply Filters (${filteredListings.length})`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e5",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  filterBadge: {
    backgroundColor: "#111",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  resultCount: {
    fontSize: 14,
    color: "#666",
  },
  gridContent: {
    paddingHorizontal: 12,
    paddingTop: 190, // Space for header + filter bar
    paddingBottom: 120,
  },
  gridItem: {
    flex: 1,
    margin: 4,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
    rowGap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
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

