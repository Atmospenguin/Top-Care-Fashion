import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
import { useAuth } from "../../../contexts/AuthContext";

type SearchResultRoute = RouteProp<BuyStackParamList, "SearchResult">;
type BuyNavigation = NativeStackNavigationProp<BuyStackParamList>;

// Clothing sizes
const CLOTHING_SIZES = ["All", "My Size", "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "Free Size"] as const;
// Shoe sizes (numbers)
const SHOE_SIZES = ["All", "My Size", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50"] as const;
// Combined sizes (for general use)
const ALL_SIZES = ["All", "My Size", "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "Free Size", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50"] as const;
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
  const { user } = useAuth();
  const {
    params: { query, category: initialCategory, gender: initialGenderParam },
  } = useRoute<SearchResultRoute>();

  const normalizedInitialGender = useMemo(
    () => mapGenderParamToOption(initialGenderParam),
    [initialGenderParam],
  );

  // Get available sizes based on selected category
  // Footwear category should show shoe sizes, others show clothing sizes
  const getAvailableSizes = useCallback((category: string): string[] => {
    const categoryLower = category?.toLowerCase() || "";
    if (categoryLower === "footwear" || categoryLower === "shoes" || categoryLower === "shoe") {
      return Array.from(SHOE_SIZES);
    }
    // Default to clothing sizes for other categories
    return Array.from(CLOTHING_SIZES);
  }, []);

  // Get user's preferred size(s) based on category
  // Returns a single size string for specific categories, or an array for "All" category
  const getUserPreferredSizes = useCallback((category: string): string[] => {
    if (!user) return [];
    
    const categoryLower = category?.toLowerCase() || "";
    const sizes: string[] = [];
    
    // Map category to user size preference(s)
    if (categoryLower === "footwear" || categoryLower === "shoes" || categoryLower === "shoe") {
      if (user.preferred_size_shoe) sizes.push(user.preferred_size_shoe);
    } else if (categoryLower === "tops" || categoryLower === "top" || categoryLower === "outerwear") {
      if (user.preferred_size_top) sizes.push(user.preferred_size_top);
    } else if (categoryLower === "bottoms" || categoryLower === "bottom") {
      if (user.preferred_size_bottom) sizes.push(user.preferred_size_bottom);
    } else {
      // For "All" or other categories, include all user's preferred sizes
      if (user.preferred_size_top) sizes.push(user.preferred_size_top);
      if (user.preferred_size_bottom) sizes.push(user.preferred_size_bottom);
      if (user.preferred_size_shoe) sizes.push(user.preferred_size_shoe);
    }
    
    // Remove duplicates and return
    return [...new Set(sizes.map(s => s.trim()).filter(Boolean))];
  }, [user]);

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
  // Initialize with default categories to ensure filter options are always available
  const [categories, setCategories] = useState<string[]>(["All", "Tops", "Bottoms", "Outerwear", "Footwear", "Accessories"]);
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

  // Map sort option to API sort parameter
  const mapSortToApiParam = (sort: string): string | undefined => {
    switch (sort) {
      case "Price Low to High":
        return "Price Low to High";
      case "Price High to Low":
        return "Price High to Low";
      case "Latest":
        return "Latest";
      default:
        return "Latest";
    }
  };

  // Load listings with current filters
  const loadListings = React.useCallback(async (resetOffset = true) => {
    try {
      if (resetOffset) {
        setInitialLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      // Handle "My Size" - get user's preferred size(s) based on category
      let sizeParam: string | undefined;
      let sizesParam: string[] | undefined;
      if (selectedSize === "My Size") {
        const preferredSizes = getUserPreferredSizes(selectedCategory)
          .map((value) => value.trim())
          .filter(Boolean);

        if (preferredSizes.length > 0) {
          const categoryLower = selectedCategory?.toLowerCase() || "";

          if (categoryLower === "all" && preferredSizes.length > 1) {
            // For "All" category with multiple sizes, search for any of the user's preferred sizes.
            // Prioritise apparel sizes (non-numeric) and make sure bottom size (e.g. "L") is included first if available.
            const nonShoeSizes = preferredSizes.filter((size) => !/^\d+$/.test(size));
            if (nonShoeSizes.length > 0) {
              const bottomSize = user?.preferred_size_bottom?.trim();
              if (bottomSize && nonShoeSizes.includes(bottomSize)) {
                // Ensure bottom size is first in the array to emphasize preference.
                sizesParam = [bottomSize, ...nonShoeSizes.filter((size) => size !== bottomSize)];
              } else {
                sizesParam = [...nonShoeSizes];
              }
              // Include numeric sizes (e.g. shoe sizes) after apparel sizes
              const shoeSizes = preferredSizes.filter((size) => /^\d+$/.test(size));
              if (shoeSizes.length > 0) {
                sizesParam.push(...shoeSizes);
              }
            } else {
              // All preferred sizes are numeric (e.g. shoe sizes)
              sizesParam = [...preferredSizes];
            }

            console.log('🔍 SearchResult: Using "My Size" with multiple preferred sizes:', {
              category: selectedCategory,
              preferredSizes,
              appliedSizes: sizesParam,
              userPreferences: {
                top: user?.preferred_size_top,
                bottom: user?.preferred_size_bottom,
                shoe: user?.preferred_size_shoe,
              },
            });
          } else {
            sizeParam = preferredSizes[0];
            console.log('🔍 SearchResult: Using "My Size" (single size):', {
              category: selectedCategory,
              preferredSizes,
              appliedSize: sizeParam,
              userPreferences: {
                top: user?.preferred_size_top,
                bottom: user?.preferred_size_bottom,
                shoe: user?.preferred_size_shoe,
              },
            });
          }
        } else {
          console.warn('🔍 SearchResult: "My Size" selected but user has no preferred size for category:', selectedCategory);
          // Don't filter by size if user has no preference
        }
      } else if (selectedSize !== "All") {
        sizeParam = selectedSize.trim();
      }

      // Build filter parameters
      const params: any = {
        search: query || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        gender: mapGenderOptionToApiParam(selectedGender),
        condition: selectedCondition !== "All" ? selectedCondition : undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        sort: mapSortToApiParam(sortBy),
      };

      if (sizesParam?.length) {
        params.sizes = sizesParam;
      } else if (sizeParam) {
        params.size = sizeParam;
      }

      // Remove undefined values
      Object.keys(params).forEach((key) => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      // Get current offset from state
      const currentOffset = resetOffset ? 0 : offset;

      console.log('🔍 SearchResult: Loading listings with filters:', {
        ...params,
        limit: PAGE_SIZE,
        offset: currentOffset,
      });
      console.log('🔍 SearchResult: Offset:', currentOffset);

      const result = await listingsService.getListings({
        ...params,
        limit: PAGE_SIZE,
        offset: currentOffset,
      });

      console.log('🔍 SearchResult: Received items:', result.items.length);
      console.log('🔍 SearchResult: Has more:', result.hasMore);
      console.log('🔍 SearchResult: Total:', result.total);

      if (resetOffset) {
        setApiListings(result.items);
        setOffset(PAGE_SIZE);
        // Always update totalCount when resetting (new filter applied)
        setTotalCount(result.total || 0);
      } else {
        setApiListings(prev => [...prev, ...result.items]);
        setOffset(prev => prev + PAGE_SIZE);
        // Don't update totalCount on loadMore, it should remain the same
        // But update if API returns a different total (shouldn't happen, but for safety)
        if (result.total !== undefined && result.total !== totalCount) {
          console.warn('🔍 SearchResult: Total count changed during loadMore:', { old: totalCount, new: result.total });
          setTotalCount(result.total);
        }
      }

      setHasMore(result.hasMore);
    } catch (error) {
      console.error('🔍 SearchResult: Error loading listings:', error);
      if (resetOffset) {
        setApiListings([]);
        setHasMore(false);
      }
    } finally {
      if (resetOffset) {
        setInitialLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedCategory, selectedGender, selectedSize, selectedCondition, minPrice, maxPrice, sortBy, getUserPreferredSizes]);

  // Track previous filter values to detect changes
  const prevFiltersRef = useRef<string>('');
  
  // Load listings when filters change
  useEffect(() => {
    // Build current filter signature
    const currentFilters = JSON.stringify({
      query,
      selectedCategory,
      selectedGender,
      selectedSize,
      selectedCondition,
      minPrice,
      maxPrice,
      sortBy,
    });

    // Only reload if filters actually changed
    if (prevFiltersRef.current !== currentFilters) {
      prevFiltersRef.current = currentFilters;
      loadListings(true);
    }
  }, [query, selectedCategory, selectedGender, selectedSize, selectedCondition, minPrice, maxPrice, sortBy, loadListings]);

  // Load more listings when scrolling to bottom
  const loadMore = React.useCallback(async () => {
    if (!hasMore || isLoadingMore || initialLoading) {
      console.log('🔍 SearchResult: Skip load more', { hasMore, isLoadingMore, initialLoading });
      return;
    }

    // Use current offset from state
    const currentOffset = offset;
    
    try {
      setIsLoadingMore(true);

      // Handle "My Size" - get user's preferred size(s) based on category (same logic as loadListings)
      let sizeParam: string | undefined;
      let sizesParam: string[] | undefined;

      if (selectedSize === "My Size") {
        const preferredSizes = getUserPreferredSizes(selectedCategory)
          .map((value) => value.trim())
          .filter(Boolean);

        if (preferredSizes.length > 0) {
          const categoryLower = selectedCategory?.toLowerCase() || "";

          if (categoryLower === "all" && preferredSizes.length > 1) {
            const nonShoeSizes = preferredSizes.filter((size) => !/^\d+$/.test(size));
            if (nonShoeSizes.length > 0) {
              const bottomSize = user?.preferred_size_bottom?.trim();
              if (bottomSize && nonShoeSizes.includes(bottomSize)) {
                sizesParam = [bottomSize, ...nonShoeSizes.filter((size) => size !== bottomSize)];
              } else {
                sizesParam = [...nonShoeSizes];
              }
              const shoeSizes = preferredSizes.filter((size) => /^\d+$/.test(size));
              if (shoeSizes.length > 0) {
                sizesParam.push(...shoeSizes);
              }
            } else {
              sizesParam = [...preferredSizes];
            }
          } else {
            sizeParam = preferredSizes[0];
          }
        }
      } else if (selectedSize !== "All") {
        sizeParam = selectedSize.trim();
      }

      // Build filter parameters (same as loadListings)
      const params: any = {
        search: query || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        gender: mapGenderOptionToApiParam(selectedGender),
        condition: selectedCondition !== "All" ? selectedCondition : undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        sort: mapSortToApiParam(sortBy),
      };

      if (sizesParam?.length) {
        params.sizes = sizesParam;
      } else if (sizeParam) {
        params.size = sizeParam;
      }

      // Remove undefined values
      Object.keys(params).forEach((key) => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      console.log('🔍 SearchResult: Loading more with filters:', params);
      console.log('🔍 SearchResult: Offset:', currentOffset);

      const result = await listingsService.getListings({
        ...params,
        limit: PAGE_SIZE,
        offset: currentOffset,
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
  }, [hasMore, isLoadingMore, initialLoading, offset, query, selectedCategory, selectedGender, selectedSize, selectedCondition, minPrice, maxPrice, sortBy, getUserPreferredSizes]);

  // Use API listings directly (no client-side filtering)
  const filteredListings = apiListings;

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

  // Calculate active temp filters count (for modal display)
  const activeTempFiltersCount = useMemo(() => {
    let count = 0;
    if (tempCategory !== "All") count++;
    if (tempGender !== "All") count++;
    if (tempSize !== "All" && tempSize !== "My Size") count++;
    if (tempCondition !== "All") count++;
    if (tempMinPrice || tempMaxPrice) count++;
    if (tempSortBy !== "Latest") count++;
    return count;
  }, [tempCategory, tempGender, tempSize, tempCondition, tempMinPrice, tempMaxPrice, tempSortBy]);

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
          <Text style={styles.resultCount}>
            {totalCount > 0 ? `${totalCount} result${totalCount === 1 ? '' : 's'}` : 
             filteredListings.length > 0 ? `${filteredListings.length} result${filteredListings.length === 1 ? '' : 's'}` : 
             '0 results'}
          </Text>
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
            // Always use totalCount from API (total filtered results)
            const displayCount = totalCount;
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
        sections={useMemo(() => {
          // Get available sizes based on temp category
          const availableSizes = getAvailableSizes(tempCategory);
          
          const filterSections = [
            {
              key: "category",
              title: "Category",
              options: categories.map((category) => ({
                label: category,
                value: category,
              })),
              selectedValue: tempCategory,
              onSelect: (value: string | number) => {
                const newCategory = String(value);
                setTempCategory(newCategory);
                // Reset size when category changes (since size options change)
                // If current size is not available in new category, reset to "All"
                const newAvailableSizes = getAvailableSizes(newCategory);
                if (tempSize !== "All" && tempSize !== "My Size" && !newAvailableSizes.includes(tempSize)) {
                  setTempSize("All");
                }
              },
            },
            {
              key: "gender",
              title: "Gender",
              options: GENDER_OPTIONS.map((gender) => ({
                label: gender,
                value: gender,
              })),
              selectedValue: tempGender,
              onSelect: (value: string | number) => setTempGender(String(value)),
            },
            {
              key: "size",
              title: "Size",
              options: availableSizes.map((size: string) => ({
                label: size,
                value: size,
              })),
              selectedValue: tempSize,
              onSelect: (value: string | number) => setTempSize(String(value)),
            },
            {
              key: "condition",
              title: "Condition",
              options: CONDITIONS.map((condition) => ({
                label: condition,
                value: condition,
              })),
              selectedValue: tempCondition,
              onSelect: (value: string | number) => setTempCondition(String(value)),
            },
            {
              key: "priceRange",
              title: "Price Range",
              type: "range" as const,
              minValue: tempMinPrice ? parseFloat(tempMinPrice) : 0,
              maxValue: tempMaxPrice ? parseFloat(tempMaxPrice) : 0,
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
              onSelect: (value: string | number) => setTempSortBy(String(value) as typeof SORT_OPTIONS[number]),
            },
          ];
          
          console.log('🔍 FilterModal sections:', JSON.stringify(filterSections.map(s => ({
            key: s.key,
            title: s.title,
            optionsCount: 'options' in s ? s.options?.length : 0,
            type: 'type' in s ? s.type : 'chip'
          })), null, 2));
          console.log('🔍 Categories:', categories);
          console.log('🔍 GENDER_OPTIONS:', GENDER_OPTIONS);
          console.log('🔍 Available Sizes:', availableSizes);
          console.log('🔍 CONDITIONS:', CONDITIONS);
          console.log('🔍 SORT_OPTIONS:', SORT_OPTIONS);
          
          return filterSections;
        }, [categories, tempCategory, tempGender, tempSize, tempCondition, tempMinPrice, tempMaxPrice, tempSortBy, getAvailableSizes])}
        onClose={() => setFilterModalVisible(false)}
        onClear={handleClearFilters}
        onApply={handleApplyFilters}
        applyButtonLabel={`Apply Filters${activeTempFiltersCount > 0 ? ` (${activeTempFiltersCount})` : ''}`}
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
    paddingTop: 170, // Space for header + filter bar
    paddingBottom: 20,
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

