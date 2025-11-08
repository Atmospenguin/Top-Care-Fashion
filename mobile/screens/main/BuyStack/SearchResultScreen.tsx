import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import FilterModal from "../../../components/FilterModal";
import type { ListingItem } from "../../../types/shop";
import type { BuyStackParamList } from "./index";
import { listingsService, type CategoryData } from "../../../src/services/listingsService";
import { listingStatsService } from "../../../src/services/listingStatsService";

type SearchResultRoute = RouteProp<BuyStackParamList, "SearchResult">;
type BuyNavigation = NativeStackNavigationProp<BuyStackParamList>;

const SIZES = ["All", "My Size", "XS", "S", "M", "L", "XL", "XXL"] as const;
const CONDITIONS = ["All", "Brand New", "Like New", "Good", "Fair"] as const;
const SORT_OPTIONS = ["Latest", "Price Low to High", "Price High to Low"] as const;
const GENDER_OPTIONS = ["All", "Men", "Women", "Unisex"] as const;

const mapGenderParamToOption = (gender?: string | null): typeof GENDER_OPTIONS[number] => {
  if (!gender) return "All";
  const lower = gender.toLowerCase();
  if (lower === "men") return "Men";
  if (lower === "women") return "Women";
  if (lower === "unisex") return "Unisex";
  return "All";
};

const mapGenderOptionToApiParam = (
  gender?: string,
): "Men" | "Women" | "Unisex" | undefined => {
  if (!gender || gender === "All") return undefined;
  const lower = gender.toLowerCase();
  if (lower === "men") return "Men";
  if (lower === "women") return "Women";
  if (lower === "unisex") return "Unisex";
  return undefined;
};

export default function SearchResultScreen() {
  const navigation = useNavigation<BuyNavigation>();
  const {
    params: { query, category: initialCategory, gender: initialGenderParam },
  } = useRoute<SearchResultRoute>();

  const normalizedInitialGender = useMemo(
    () => mapGenderParamToOption(initialGenderParam),
    [initialGenderParam],
  );

  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Applied filters (used for actual filtering)
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || "All");
  const [selectedSize, setSelectedSize] = useState<string>("All");
  const [selectedCondition, setSelectedCondition] = useState<string>("All");
  const [selectedGender, setSelectedGender] = useState<string>(normalizedInitialGender);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<typeof SORT_OPTIONS[number]>("Latest");

  // Temporary filters (used in modal, applied on button click)
  const [tempCategory, setTempCategory] = useState<string>("All");
  const [tempSize, setTempSize] = useState<string>("All");
  const [tempCondition, setTempCondition] = useState<string>("All");
  const [tempGender, setTempGender] = useState<string>(normalizedInitialGender);
  const [tempMinPrice, setTempMinPrice] = useState<string>("");
  const [tempMaxPrice, setTempMaxPrice] = useState<string>("");
  const [tempSortBy, setTempSortBy] = useState<typeof SORT_OPTIONS[number]>("Latest");

  // Scroll animation state
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const [headerVisible, setHeaderVisible] = useState(true);

  const [apiListings, setApiListings] = useState<ListingItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Pagination state
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20;
  const viewedItemsRef = useRef<Set<string>>(new Set()); // 追踪已记录views的商品

  useEffect(() => {
    setSelectedGender(normalizedInitialGender);
    setTempGender(normalizedInitialGender);
  }, [normalizedInitialGender]);

  // Load categories from database
  useEffect(() => {
    let mounted = true;
    console.log('🔍 SearchResult: Loading categories from DB...');
    listingsService.getCategories()
      .then((data: CategoryData) => {
        if (!mounted) return;
        // Extract all unique category names from all genders
        const allCategories = new Set<string>();
        allCategories.add("All");

        Object.values(data).forEach((genderData) => {
          Object.keys(genderData).forEach((category) => {
            allCategories.add(category);
          });
        });

        const categoryArray = Array.from(allCategories);
        console.log('🔍 SearchResult: Loaded categories:', categoryArray);
        setCategories(categoryArray);
      })
      .catch((error) => {
        console.error('🔍 SearchResult: Error loading categories:', error);
        // Fallback to default categories
        setCategories(["All", "Tops", "Bottoms", "Outerwear", "Footwear", "Accessories"]);
      })
      .finally(() => {
        if (mounted) setCategoriesLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Load initial listings with pagination
  useEffect(() => {
    loadInitialListings();
  }, [query, initialCategory, normalizedInitialGender]);

  const loadInitialListings = async () => {
    try {
      setInitialLoading(true);
      console.log('🔍 SearchResult: Loading initial listings...');

      const result = await listingsService.getListings({
        search: query || undefined,
        category: initialCategory && initialCategory !== 'All' ? initialCategory : undefined,
        gender: mapGenderOptionToApiParam(normalizedInitialGender),
        limit: PAGE_SIZE,
        offset: 0,
      });

      console.log('🔍 SearchResult: Received items:', result.items.length);
      console.log('🔍 SearchResult: Has more:', result.hasMore);
      console.log('🔍 SearchResult: Total:', result.total);
      console.log('🔍 SearchResult: First item:', JSON.stringify(result.items[0], null, 2));

      // ✅ Use items directly from API - no error-prone mapping!
      setApiListings(result.items);
      setHasMore(result.hasMore);
      setTotalCount(result.total);
      setOffset(PAGE_SIZE);
    } catch (error) {
      console.error('🔍 SearchResult: Error loading listings:', error);
      setApiListings([]);
      setHasMore(false);
    } finally {
      setInitialLoading(false);
    }
  };

  // Load more listings when scrolling to bottom
  const loadMore = async () => {
    if (!hasMore || isLoadingMore || initialLoading) {
      console.log('🔍 SearchResult: Skip load more', { hasMore, isLoadingMore, initialLoading });
      return;
    }

    try {
      setIsLoadingMore(true);
      console.log('🔍 SearchResult: Loading more listings at offset:', offset);

      const result = await listingsService.getListings({
        search: query || undefined,
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        gender: mapGenderOptionToApiParam(selectedGender),
        limit: PAGE_SIZE,
        offset: offset,
      });

      console.log('🔍 SearchResult: Loaded', result.items.length, 'more items');

      setApiListings(prev => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setOffset(prev => prev + PAGE_SIZE);
    } catch (error) {
      console.error('🔍 SearchResult: Error loading more:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const sourceListings = apiListings;

  const filteredListings = useMemo(() => {
    console.log('🔍 SearchResult: Filtering with query:', query);
    console.log('🔍 SearchResult: Initial category:', initialCategory);
    console.log('🔍 SearchResult: Selected category:', selectedCategory);
    console.log('🔍 SearchResult: Source listings count:', sourceListings.length);

    // If query is empty, don't filter by title
    let results = query ? sourceListings.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    ) : sourceListings;
    console.log('🔍 SearchResult: After query filter:', results.length);

    if (selectedCategory !== "All") {
      console.log('🔍 SearchResult: Filtering by category:', selectedCategory);
      results = results.filter((item) => {
        const categoryLower = selectedCategory.toLowerCase();
        const itemCategory = (item.category ?? "").toString().toLowerCase();
        console.log('🔍 SearchResult: Item category:', item.category, '-> mapped:', itemCategory, 'vs filter:', categoryLower);

        // Match API format: category values can be "Tops", "Bottoms", "Footwear", "Accessories"
        // or legacy format: "top", "bottom", "shoe", "accessory"
        if (categoryLower === "tops") {
          return itemCategory === "top" || itemCategory === "tops";
        }
        if (categoryLower === "bottoms") {
          return itemCategory === "bottom" || itemCategory === "bottoms";
        }
        if (categoryLower === "footwear") {
          return itemCategory === "shoe" || itemCategory === "footwear";
        }
        if (categoryLower === "accessories") {
          return itemCategory === "accessory" || itemCategory === "accessories";
        }
        if (categoryLower === "outerwear") {
          return itemCategory === "outerwear";
        }
        return true;
      });
      console.log('🔍 SearchResult: After category filter:', results.length);
    }

    if (selectedGender !== "All") {
      const selectedGenderLower = selectedGender.toLowerCase();
      console.log('🔍 SearchResult: Filtering by gender:', selectedGenderLower);
      results = results.filter((item) => {
        const itemGender = (item.gender ?? "").toString().toLowerCase();
        if (!itemGender) return false;
        if (selectedGenderLower === "men") {
          return itemGender === "men" || itemGender === "male";
        }
        if (selectedGenderLower === "women") {
          return itemGender === "women" || itemGender === "female";
        }
        return itemGender === "unisex";
      });
      console.log('🔍 SearchResult: After gender filter:', results.length);
    }

    if (selectedSize !== "All") {
      if (selectedSize === "My Size") {
        // TODO: Get user's preferred size from user settings/preferences
        const userPreferredSize = "M"; // Default to M for now
        results = results.filter((item) => item.size === userPreferredSize);
      } else {
        results = results.filter((item) => item.size === selectedSize);
      }
      console.log('🔍 SearchResult: After size filter:', results.length);
    }

    if (selectedCondition !== "All") {
      results = results.filter((item) => {
        const itemCondition = (item.condition ?? "").toString().trim();
        // 🔥 处理 "Like New" 和 "Like new" 的映射
        if (selectedCondition === "Like New") {
          return itemCondition === "Like New" || itemCondition === "Like new" || itemCondition === "LIKE_NEW";
        }
        // 其他条件直接匹配
        return itemCondition === selectedCondition;
      });
      console.log('🔍 SearchResult: After condition filter:', results.length);
    }

    // Apply custom price range
    const min = minPrice ? parseFloat(minPrice) : 0;
    const max = maxPrice ? parseFloat(maxPrice) : Infinity;
    if (minPrice || maxPrice) {
      results = results.filter((item) => item.price >= min && item.price <= max);
      console.log('🔍 SearchResult: After price filter:', results.length);
    }

    // Apply sorting
    if (sortBy === "Price Low to High") {
      results = [...results].sort((a, b) => a.price - b.price);
    } else if (sortBy === "Price High to Low") {
      results = [...results].sort((a, b) => b.price - a.price);
    }
    // Latest is the default order

    console.log('🔍 SearchResult: Final filtered count:', results.length);
    if (results.length > 0) {
      console.log('🔍 SearchResult: First filtered item:', JSON.stringify(results[0], null, 2));
    }

    return results;
  }, [
    query,
    selectedCategory,
    selectedGender,
    selectedSize,
    selectedCondition,
    minPrice,
    maxPrice,
    sortBy,
    sourceListings,
  ]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "All") count++;
    if (selectedGender !== "All") count++;
    if (selectedSize !== "All") count++;
    if (selectedCondition !== "All") count++;
    if (minPrice || maxPrice) count++;
    if (sortBy !== "Latest") count++;
    return count;
  }, [selectedCategory, selectedGender, selectedSize, selectedCondition, minPrice, maxPrice, sortBy]);

  const handleOpenFilters = () => {
    // Sync temp filters with current applied filters
    setTempCategory(selectedCategory);
    setTempSize(selectedSize);
    setTempCondition(selectedCondition);
    setTempGender(selectedGender);
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setTempSortBy(sortBy);
    setFilterModalVisible(true);
  };

  const handleClearFilters = () => {
    setTempCategory("All");
    setTempSize("All");
    setTempCondition("All");
    setTempGender("All");
    setTempMinPrice("");
    setTempMaxPrice("");
    setTempSortBy("Latest");
  };

  const handleApplyFilters = () => {
    setSelectedCategory(tempCategory);
    setSelectedSize(tempSize);
    setSelectedCondition(tempCondition);
    setSelectedGender(tempGender);
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

  // ✅ 追踪商品视图（当商品出现在列表中时）
  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    viewableItems.forEach((viewableItem: any) => {
      const itemId = String(viewableItem.item?.id);
      if (itemId && !viewedItemsRef.current.has(itemId)) {
        viewedItemsRef.current.add(itemId);
        // 记录视图（静默失败，不影响用户体验）
        listingStatsService.recordView(itemId).catch((error) => {
          console.warn('Failed to record view:', error);
        });
      }
    });
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // 商品至少50%可见时才记录
  }).current;

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
          <Text style={styles.resultCount}>{totalCount > 0 ? totalCount : filteredListings.length} results</Text>
        </View>
      </Animated.View>

      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={handleViewableItemsChanged}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate("ListingDetail", { listingId: item.id })}
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
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          initialLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text style={{ marginTop: 16, color: '#666' }}>Loading...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="search-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your filters or search terms
              </Text>
            </View>
          )
        }
        ListFooterComponent={() => {
          if (isLoadingMore) {
            return (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#7C3AED" />
                <Text style={{ marginTop: 8, color: '#666', fontSize: 14 }}>
                  Loading more...
                </Text>
              </View>
            );
          }

          if (!hasMore && filteredListings.length > 0) {
            const displayCount = totalCount > 0 ? totalCount : filteredListings.length;
            return (
              <View style={styles.footerContainer}>
                <View style={styles.footerDivider} />
                <Text style={styles.footerText}>
                  You've reached the end • {displayCount} {displayCount === 1 ? 'item' : 'items'} found
                </Text>
                <Text style={styles.footerSubtext}>
                  Try adjusting your filters to see more results
                </Text>
              </View>
            );
          }

          return null;
        }}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        sections={[
          {
            key: "category",
            title: "Category",
            options: categories.map((category) => ({
              label: category,
              value: category,
            })),
            selectedValue: tempCategory,
            onSelect: (value) => setTempCategory(String(value)),
          },
          {
            key: "gender",
            title: "Gender",
            options: GENDER_OPTIONS.map((gender) => ({
              label: gender,
              value: gender,
            })),
            selectedValue: tempGender,
            onSelect: (value) => setTempGender(String(value)),
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

