import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  InteractionManager,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';

import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import type {
  ListingItem,
  BagItem,
  ListingCategory,
} from "../../../types/shop";
import { MOCK_LISTINGS } from "../../../mocks/shop";
import type { BuyStackParamList } from "./index";
// ✨ NEW: Import AI matching service
import { getAISuggestions, type SuggestedOutfit } from "../../../services/aiMatchingService";

const { width } = Dimensions.get("window");
const GAP = 12; // gap between cards
const FRAME_W = Math.floor(width * 0.61);
const FRAME_H = Math.floor(FRAME_W);
// keep tops and bottoms close to a square
const TB_W = Math.floor(width * 0.61);
const TB_H = Math.floor(TB_W);
// shoes are shorter rectangles
const SH_W = Math.floor(width * 0.61);
const SH_H = Math.floor(SH_W * 0.75); // ⭐ INCREASED from 0.56 to 0.75 to show full shoe
const H_PADDING = 16;
const ACCESSORY_COLUMNS = 2;
const ACCESSORY_GAP = 12;
const ACC_W = Math.floor(
  (width - H_PADDING * 2 - ACCESSORY_GAP) / ACCESSORY_COLUMNS
);
const ACC_H = Math.floor(ACC_W * 1.08);

const CATEGORY_KEYWORDS: Record<ListingCategory, RegExp> = {
  Accessories: /bag|belt|bracelet|earring|necklace|ring|scarf|hat|watch/i,
  Bottoms: /skirt|pant|trouser|jean|legging|short|bottom/i,
  Footwear: /shoe|sneaker|boot|heel|loafer|flat|footwear|sandal/i,
  Outerwear: /coat|jacket|blazer|outerwear|vest/i,
  Tops: /dress|top|shirt|tee|sweater|hoodie|blouse|cardigan|turtleneck/i,
};

type MatchResult = {
  baseCategory: ListingCategory | "other";
  tops: ListingItem[];
  bottoms: ListingItem[];
  footwear: ListingItem[];
  accessories: ListingItem[];
  fallback: ListingItem[];
};

function categorizeItem(item: ListingItem): ListingCategory | "other" {
  if (item.category) {
    if (item.category === "Outerwear") {
      return "Tops";
    }
    return item.category;
  }
  const entry = Object.entries(CATEGORY_KEYWORDS).find(([, regex]) =>
    regex.test(item.title)
  );
  if (entry) {
    const [category] = entry;
    return category === "Outerwear" ? "Tops" : (category as ListingCategory);
  }
  return "other";
}

// ✅ FIXED: Now accepts allListings parameter instead of using MOCK_LISTINGS
function findMatches(base: ListingItem, allListings: ListingItem[]): MatchResult {
  const baseCategory = categorizeItem(base);
  const others = allListings.filter((item) => item.id !== base.id);
  const byCategory = (category: ListingCategory) =>
    others.filter((item) => categorizeItem(item) === category);
  const fallback = others.length ? others : [base];
  return {
    baseCategory,
    tops: byCategory("Tops"),
    bottoms: byCategory("Bottoms"),
    footwear: byCategory("Footwear"),
    accessories: byCategory("Accessories"),
    fallback,
  };
}

export default function MixMatchScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<BuyStackParamList>>();
  const route = useRoute<RouteProp<BuyStackParamList, "MixMatch">>();
  const baseItem = route.params.baseItem;
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // ✅ Fetch real listings from API
  const [realListings, setRealListings] = useState<ListingItem[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  // ✨ NEW: AI Suggestions state
  const [suggestedTops, setSuggestedTops] = useState<ListingItem[]>([]);
  const [suggestedBottoms, setSuggestedBottoms] = useState<ListingItem[]>([]);
  const [suggestedShoes, setSuggestedShoes] = useState<ListingItem[]>([]);
  const [suggestedAccessories, setSuggestedAccessories] = useState<ListingItem[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [aiSuggestionsReady, setAiSuggestionsReady] = useState(false);
  
  // ⭐ NEW: Store AI match scores for display
  const [topScores, setTopScores] = useState<Map<string, number>>(new Map());
  const [bottomScores, setBottomScores] = useState<Map<string, number>>(new Map());
  const [shoeScores, setShoeScores] = useState<Map<string, number>>(new Map());
  const [accessoryScores, setAccessoryScores] = useState<Map<string, number>>(new Map());

  // ✅ CRITICAL: All useState hooks MUST be before any conditional returns
  const [topIndex, setTopIndex] = useState(0);
  const [bottomIndex, setBottomIndex] = useState(0);
  const [shoeIndex, setShoeIndex] = useState(0);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState<string[]>([]);
  const [tipVisible, setTipVisible] = useState(true);
  const tipTranslateY = useRef(new Animated.Value(0)).current;
  const tipOpacity = useRef(new Animated.Value(1)).current;
  const bounceAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const fadeAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hardHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ✅ Fetch listings from API
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        console.log('🔍 Fetching all listings for Mix & Match...');
        
        const response = await fetch(
          `http://192.168.31.188:3000/api/listings?limit=100`,
          {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const result = await response.json();
        const listings = result.data?.items || [];
        
        console.log('✅ Fetched', listings.length, 'listings for Mix & Match');

        // Convert to ListingItem format
        const formatted: ListingItem[] = listings.map((item: any) => ({
          id: String(item.id),
          title: item.title || item.name || 'Unknown Item',
          price: item.price || 0,
          images: item.images || item.image_urls || (item.image_url ? [item.image_url] : []),
          category: item.category as ListingCategory,
          condition: item.condition,
          size: item.size,
          brand: item.brand,
          seller: item.seller,
          gender: item.gender,
          tags: item.tags || [],
          likesCount: item.likesCount || 0,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }));

        setRealListings(formatted);
      } catch (error) {
        console.error('❌ Failed to fetch listings for Mix & Match:', error);
        // Fallback to mock listings if API fails
        console.log('⚠️ Using MOCK_LISTINGS as fallback');
        setRealListings(MOCK_LISTINGS);
      } finally {
        setLoadingListings(false);
      }
    };

    fetchListings();
  }, []);

  // ✨ NEW: Fetch AI suggestions when baseItem and listings are ready
  const fetchAISuggestions = useCallback(async () => {
    if (!baseItem || realListings.length === 0 || loadingListings) return;

    setLoadingSuggestions(true);
    setAiSuggestionsReady(false);
    console.log('🤖 Getting AI suggestions for:', baseItem.title);

    try {
      const suggestions = await getAISuggestions(baseItem, realListings);
      
      setSuggestedTops(suggestions.tops);
      setSuggestedBottoms(suggestions.bottoms);
      setSuggestedShoes(suggestions.shoes);
      setSuggestedAccessories(suggestions.accessories);
      
      // ⭐ NEW: Save the match scores for display
      setTopScores(suggestions.topScores);
      setBottomScores(suggestions.bottomScores);
      setShoeScores(suggestions.shoeScores);
      setAccessoryScores(suggestions.accessoryScores);
      
      setAiSuggestionsReady(true);
      
      console.log('✅ AI suggestions loaded!');
      console.log('   - Tops:', suggestions.tops.length);
      console.log('   - Bottoms:', suggestions.bottoms.length);
      console.log('   - Shoes:', suggestions.shoes.length);
      console.log('   - Accessories:', suggestions.accessories.length);
    } catch (error) {
      console.error('❌ Failed to get AI suggestions:', error);
      setAiSuggestionsReady(false);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [baseItem, realListings, loadingListings]);

  // ✨ NEW: Trigger AI suggestions when listings are loaded
  useEffect(() => {
    if (baseItem && realListings.length > 0 && !loadingListings) {
      fetchAISuggestions();
    }
  }, [baseItem, realListings.length, loadingListings, fetchAISuggestions]);

  useEffect(() => {
    if (!tipVisible) return;
    tipTranslateY.setValue(0);
    tipOpacity.setValue(1);

    const startAnimations = () => {
      const bounce = Animated.sequence([
        Animated.timing(tipTranslateY, {
          toValue: -28,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(tipTranslateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]);
      bounceAnimRef.current = bounce;
      bounce.start();

      // Schedule fade-out after short delay
      fadeTimeoutRef.current = setTimeout(() => {
        const fade = Animated.timing(tipOpacity, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        });
        fadeAnimRef.current = fade;
        fade.start(({ finished }) => {
          if (fadeAnimRef.current === fade) fadeAnimRef.current = null;
          if (finished) setTipVisible(false);
        });
      }, 2200);

      // Hard fallback to ensure dismissal even if animations are interrupted
      hardHideTimeoutRef.current = setTimeout(() => {
        setTipVisible(false);
      }, 4000);
    };

    // Start after JS interactions settle to avoid being canceled on mount
    const i = InteractionManager.runAfterInteractions(startAnimations);

    return () => {
      i.cancel?.();
      bounceAnimRef.current?.stop();
      bounceAnimRef.current = null;
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }
      if (hardHideTimeoutRef.current) {
        clearTimeout(hardHideTimeoutRef.current);
        hardHideTimeoutRef.current = null;
      }
      fadeAnimRef.current?.stop();
      fadeAnimRef.current = null;
    };
  }, [tipVisible, tipTranslateY, tipOpacity]);

  useEffect(() => {
    setTopIndex(0);
    setBottomIndex(0);
    setShoeIndex(0);
    setSelectedAccessoryIds([]);
    bounceAnimRef.current?.stop();
    bounceAnimRef.current = null;
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
    fadeAnimRef.current?.stop();
    fadeAnimRef.current = null;
    tipTranslateY.setValue(0);
    tipOpacity.setValue(1);
    setTipVisible(true);
  }, [baseItem.id, tipTranslateY, tipOpacity]);

  // ✅ FIXED: Now uses realListings instead of MOCK_LISTINGS
  const matches = useMemo(
    () => findMatches(baseItem, realListings),
    [baseItem, realListings]
  );
  
  const { baseCategory, tops, bottoms, footwear, accessories, fallback } = matches;

  // ✨ NEW: Use AI-suggested items if ready, otherwise use regular matches
  const displayTops = aiSuggestionsReady && suggestedTops.length > 0 ? suggestedTops : tops;
  const displayBottoms = aiSuggestionsReady && suggestedBottoms.length > 0 ? suggestedBottoms : bottoms;
  const displayShoes = aiSuggestionsReady && suggestedShoes.length > 0 ? suggestedShoes : footwear;
  const displayAccessories = aiSuggestionsReady && suggestedAccessories.length > 0 ? suggestedAccessories : accessories;

  const ensurePool = (pool: ListingItem[]) => (pool.length ? pool : fallback);
  const topPool = ensurePool(displayTops);
  const bottomPool = ensurePool(displayBottoms);
  const shoePool = ensurePool(displayShoes);

  const pickFromPool = (pool: ListingItem[], index: number) =>
    pool.length ? pool[index % pool.length] : undefined;

  const pickedTop =
    baseCategory === "Tops" ? baseItem : pickFromPool(topPool, topIndex);
  const pickedBottom =
    baseCategory === "Bottoms"
      ? baseItem
      : pickFromPool(bottomPool, bottomIndex);
  const pickedShoe =
    baseCategory === "Footwear" ? baseItem : pickFromPool(shoePool, shoeIndex);

  const baseOutfitItems = useMemo<ListingItem[]>(() => {
    const ordered = [pickedTop, pickedBottom, pickedShoe];
    if (!ordered.some((item) => item?.id === baseItem.id)) {
      ordered.unshift(baseItem);
    }
    const unique = new Map<string, ListingItem>();
    ordered.forEach((item) => {
      if (item) unique.set(item.id, item);
    });
    return Array.from(unique.values());
  }, [pickedTop, pickedBottom, pickedShoe, baseItem]);

  const selectedAccessoryItems = useMemo(() => {
    return displayAccessories.filter((item) =>
      selectedAccessoryIds.includes(item.id)
    );
  }, [displayAccessories, selectedAccessoryIds]);

  const viewTop = baseCategory === "Tops" ? baseItem : pickedTop;
  const viewBottom = baseCategory === "Bottoms" ? baseItem : pickedBottom;
  const viewShoe = baseCategory === "Footwear" ? baseItem : pickedShoe;

  const selection = useMemo<BagItem[]>(() => {
    const allItems = [...baseOutfitItems, ...selectedAccessoryItems];
    const unique = new Map<string, ListingItem>();
    allItems.forEach((item) => {
      if (item) unique.set(item.id, item);
    });
    return Array.from(unique.values()).map((item) => ({ item, quantity: 1 }));
  }, [baseOutfitItems, selectedAccessoryItems]);

  const navigateToViewOutfit = useCallback(() => {
    navigation.navigate("ViewOutfit", {
      baseItem,
      top: viewTop,
      bottom: viewBottom,
      shoe: viewShoe,
      accessories: selectedAccessoryItems,
      selection,
      // ⭐ NEW: Pass match scores for saving
      matchScores: {
        topScore: viewTop && viewTop.id !== baseItem.id ? topScores.get(viewTop.id) || 0 : 0,
        bottomScore: viewBottom && viewBottom.id !== baseItem.id ? bottomScores.get(viewBottom.id) || 0 : 0,
        shoeScore: viewShoe && viewShoe.id !== baseItem.id ? shoeScores.get(viewShoe.id) || 0 : 0,
        accessoryScores: new Map(
          selectedAccessoryItems.map(item => [
            item.id,
            accessoryScores.get(item.id) || 0
          ])
        ),
      },
    });
  }, [
    navigation,
    baseItem,
    viewTop,
    viewBottom,
    viewShoe,
    selectedAccessoryItems,
    selection,
    topScores,
    bottomScores,
    shoeScores,
    accessoryScores,
  ]);

  // ⭐ NEW: Helper to render match percentage badge
  const getMatchBadge = useCallback((itemId: string, category: 'top' | 'bottom' | 'shoe' | 'accessory') => {
    if (!aiSuggestionsReady) return null;
    
    let score = 0;
    if (category === 'top') score = topScores.get(itemId) || 0;
    if (category === 'bottom') score = bottomScores.get(itemId) || 0;
    if (category === 'shoe') score = shoeScores.get(itemId) || 0;
    if (category === 'accessory') score = accessoryScores.get(itemId) || 0;
    
    if (score === 0) return null;
    
    // Determine badge color based on score
    let badgeColor = '#4CAF50'; // Green for high match
    let starColor = '#FFD700'; // Gold star
    
    if (score < 70) {
      badgeColor = '#FF9800'; // Orange for medium match
      starColor = '#FFA500';
    }
    if (score < 50) {
      badgeColor = '#9E9E9E'; // Gray for low match
      starColor = '#BDBDBD';
    }
    
    return (
      <View style={[styles.matchBadge, { backgroundColor: badgeColor }]}>
        <Icon name="star" size={12} color={starColor} />
        <Text style={styles.matchBadgeText}>{Math.round(score)}%</Text>
      </View>
    );
  }, [aiSuggestionsReady, topScores, bottomScores, shoeScores, accessoryScores]);

  const handleTopChange = useCallback((delta: 1 | -1) => {
    setTopIndex((prev) => prev + delta);
  }, []);

  const handleBottomChange = useCallback((delta: 1 | -1) => {
    setBottomIndex((prev) => prev + delta);
  }, []);

  const handleShoeChange = useCallback((delta: 1 | -1) => {
    setShoeIndex((prev) => prev + delta);
  }, []);

  const handleAccessoryToggle = useCallback((id: string) => {
    setSelectedAccessoryIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const renderTop = useCallback(() => {
    if (baseCategory === "Tops") {
      return (
        <View style={styles.topSection}>
          <View style={styles.topFrame}>
            <Image
              source={{ uri: baseItem.images[0] }}
              style={styles.topImage}
              resizeMode="cover"
            />
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>${baseItem.price.toFixed(0)}</Text>
            </View>
            <View style={styles.baseItemBadge}>
              <Text style={styles.baseItemBadgeText}>BASE</Text>
            </View>
          </View>
        </View>
      );
    }
    if (!pickedTop) return null;

    return (
      <View style={styles.topSection}>
        <TouchableOpacity
          style={styles.prevButton}
          onPress={() => handleTopChange(-1)}
          activeOpacity={0.7}
        >
          <Icon name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.topFrame}>
          <Image
            source={{ uri: pickedTop.images[0] }}
            style={styles.topImage}
            resizeMode="cover"
          />
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>${pickedTop.price.toFixed(0)}</Text>
          </View>
          {/* ⭐ NEW: Show AI match percentage */}
          {getMatchBadge(pickedTop.id, 'top')}
        </View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => handleTopChange(1)}
          activeOpacity={0.7}
        >
          <Icon name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>
      </View>
    );
  }, [baseCategory, baseItem, pickedTop, handleTopChange, getMatchBadge]);

  const renderBottom = useCallback(() => {
    if (baseCategory === "Bottoms") {
      return (
        <View style={styles.bottomSection}>
          <View style={styles.bottomFrame}>
            <Image
              source={{ uri: baseItem.images[0] }}
              style={styles.bottomImage}
              resizeMode="cover"
            />
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>${baseItem.price.toFixed(0)}</Text>
            </View>
            <View style={styles.baseItemBadge}>
              <Text style={styles.baseItemBadgeText}>BASE</Text>
            </View>
          </View>
        </View>
      );
    }
    if (!pickedBottom) return null;

    return (
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.prevButton}
          onPress={() => handleBottomChange(-1)}
          activeOpacity={0.7}
        >
          <Icon name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.bottomFrame}>
          <Image
            source={{ uri: pickedBottom.images[0] }}
            style={styles.bottomImage}
            resizeMode="cover"
          />
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>${pickedBottom.price.toFixed(0)}</Text>
          </View>
          {/* ⭐ NEW: Show AI match percentage */}
          {getMatchBadge(pickedBottom.id, 'bottom')}
        </View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => handleBottomChange(1)}
          activeOpacity={0.7}
        >
          <Icon name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>
      </View>
    );
  }, [baseCategory, baseItem, pickedBottom, handleBottomChange, getMatchBadge]);

  const renderShoe = useCallback(() => {
    if (baseCategory === "Footwear") {
      return (
        <View style={styles.shoeSection}>
          <View style={styles.shoeFrame}>
            <Image
              source={{ uri: baseItem.images[0] }}
              style={styles.shoeImage}
              resizeMode="cover"
            />
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>${baseItem.price.toFixed(0)}</Text>
            </View>
            <View style={styles.baseItemBadge}>
              <Text style={styles.baseItemBadgeText}>BASE</Text>
            </View>
          </View>
        </View>
      );
    }
    if (!pickedShoe) return null;

    return (
      <View style={styles.shoeSection}>
        <TouchableOpacity
          style={styles.prevButton}
          onPress={() => handleShoeChange(-1)}
          activeOpacity={0.7}
        >
          <Icon name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.shoeFrame}>
          <Image
            source={{ uri: pickedShoe.images[0] }}
            style={styles.shoeImage}
            resizeMode="cover"
          />
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>${pickedShoe.price.toFixed(0)}</Text>
          </View>
          {/* ⭐ NEW: Show AI match percentage */}
          {getMatchBadge(pickedShoe.id, 'shoe')}
        </View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => handleShoeChange(1)}
          activeOpacity={0.7}
        >
          <Icon name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>
      </View>
    );
  }, [baseCategory, baseItem, pickedShoe, handleShoeChange, getMatchBadge]);

  const renderAccessoryItem = useCallback(
    ({ item }: { item: ListingItem }) => {
      const isSelected = selectedAccessoryIds.includes(item.id);
      const score = accessoryScores.get(item.id) || 0;
      
      return (
        <TouchableOpacity
          key={item.id}
          style={[styles.accessoryCard, isSelected && styles.accessoryCardSelected]}
          activeOpacity={0.8}
          onPress={() => handleAccessoryToggle(item.id)}
        >
          <Image
            source={{ uri: item.images[0] }}
            style={styles.accessoryImage}
            resizeMode="cover"
          />
          {isSelected && (
            <View style={styles.checkmark}>
              <Icon name="checkmark" size={18} color="#fff" />
            </View>
          )}
          <View style={styles.accessoryInfo}>
            <Text style={styles.accessoryPrice}>${item.price.toFixed(0)}</Text>
            {/* ⭐ NEW: Show match score for accessories */}
            {aiSuggestionsReady && score > 0 && (
              <Text style={styles.accessoryMatchText}>⭐ {Math.round(score)}%</Text>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [selectedAccessoryIds, accessoryScores, aiSuggestionsReady, handleAccessoryToggle]
  );

  // ✅ Show loading state while fetching listings
  if (loadingListings) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <Header title="Mix & Match" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading items...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title="Mix & Match" showBack />

      {/* ✨ NEW: AI Suggestions Badge */}
      {loadingSuggestions && (
        <View style={styles.aiBadge}>
          <ActivityIndicator size="small" color="#FFD700" />
          <Text style={styles.aiBadgeText}>AI suggesting matches...</Text>
        </View>
      )}
      {aiSuggestionsReady && !loadingSuggestions && (
        <View style={styles.aiSuccessBadge}>
          <Icon name="sparkles" size={16} color="#4CAF50" />
          <Text style={styles.aiSuccessText}>AI-curated suggestions ✨</Text>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {renderTop()}
        {renderBottom()}
        {renderShoe()}

        <View style={styles.accessorySection}>
          <Text style={styles.accessorySectionTitle}>
            ACCESSORIES ({suggestedAccessories.length})
          </Text>
          {displayAccessories.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No accessories available</Text>
            </View>
          ) : (
            <FlatList
              data={displayAccessories}
              renderItem={renderAccessoryItem}
              keyExtractor={(item) => item.id}
              numColumns={ACCESSORY_COLUMNS}
              scrollEnabled={false}
              columnWrapperStyle={styles.accessoryRow}
              contentContainerStyle={styles.accessoryGrid}
            />
          )}
        </View>
      </ScrollView>

      {tipVisible && (
        <Animated.View
          style={[
            styles.swipeTip,
            {
              bottom: insets.bottom + 120,
              opacity: tipOpacity,
              transform: [{ translateY: tipTranslateY }],
            },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={["rgba(0,0,0,0.85)", "rgba(0,0,0,0.92)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tipGradient}
          >
            <View style={styles.tipContent}>
              <Icon name="arrow-back" size={18} color="#fff" />
              <Text style={styles.tipText}>Swipe to change items</Text>
              <Icon name="arrow-forward" size={18} color="#fff" />
            </View>
          </LinearGradient>
        </Animated.View>
      )}

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <TouchableOpacity
          style={styles.viewOutfitButton}
          onPress={navigateToViewOutfit}
          activeOpacity={0.9}
        >
          <Text style={styles.viewOutfitButtonText}>View Outfit</Text>
          <Icon name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  // ✨ NEW: AI Badge Styles
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  aiBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B',
  },
  aiSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 12,
  },
  aiSuccessText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  topSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: H_PADDING,
    marginTop: 20,
    marginBottom: GAP,
  },
  bottomSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: H_PADDING,
    marginBottom: GAP,
  },
  shoeSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: H_PADDING,
    marginBottom: 40, // ⭐ INCREASED from 24 to 40 to prevent cutoff
  },
  prevButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#fff",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  nextButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#fff",
    marginLeft: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  topFrame: {
    width: TB_W,
    height: TB_H,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
  },
  bottomFrame: {
    width: TB_W,
    height: TB_H,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
  },
  shoeFrame: {
    width: SH_W,
    height: SH_H,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
  },
  topImage: {
    width: "100%",
    height: "100%",
  },
  bottomImage: {
    width: "100%",
    height: "100%",
  },
  shoeImage: {
    width: "100%",
    height: "100%",
  },
  priceBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  priceBadgeText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111",
  },
  baseItemBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "#FFD700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  baseItemBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#000",
    letterSpacing: 1,
  },
  basePlaceholder: {
    width: TB_W,
    height: TB_H,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
  },
  basePlaceholderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
  },
  accessorySection: {
    paddingHorizontal: H_PADDING,
    marginTop: 24, // ⭐ INCREASED from 8 to 24 for more spacing
  },
  accessorySectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#6a6a6a",
    marginBottom: 12,
  },
  accessoryGrid: {
    paddingBottom: 20,
  },
  accessoryRow: {
    justifyContent: "space-between",
    marginBottom: ACCESSORY_GAP,
  },
  accessoryCard: {
    width: ACC_W,
    height: ACC_H,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  accessoryCardSelected: {
    borderWidth: 3,
    borderColor: "#4CAF50",
  },
  accessoryImage: {
    width: "100%",
    height: "100%",
  },
  accessoryInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  accessoryPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111",
  },
  // ⭐ NEW: Match percentage badge for main items
  matchBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  // ⭐ NEW: Match text for accessories
  accessoryMatchText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFD700",
    marginTop: 2,
  },
  checkmark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  viewOutfitButton: {
    backgroundColor: "#111",
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  viewOutfitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  swipeTip: {
    position: "absolute",
    left: 20,
    right: 20,
    alignItems: "center",
  },
  tipGradient: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
