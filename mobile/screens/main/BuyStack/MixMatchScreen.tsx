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
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import type {
  ListingItem,
  BagItem,
  ListingCategory,
} from "../../../types/shop";
import { MOCK_LISTINGS } from "../../../mocks/shop";
import type { BuyStackParamList } from "./index";

const { width } = Dimensions.get("window");
const GAP = 12; // gap between cards
const FRAME_W = Math.floor(width * 0.61);
const FRAME_H = Math.floor(FRAME_W);
// keep tops and bottoms close to a square
const TB_W = Math.floor(width * 0.61);
const TB_H = Math.floor(TB_W);
// shoes are shorter rectangles
const SH_W = Math.floor(width * 0.61);
const SH_H = Math.floor(SH_W * 0.56);
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

function findMatches(base: ListingItem): MatchResult {
  const baseCategory = categorizeItem(base);
  const others = MOCK_LISTINGS.filter((item) => item.id !== base.id);
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

  const matches = useMemo(() => findMatches(baseItem), [baseItem]);
  const { baseCategory, tops, bottoms, footwear, accessories, fallback } = matches;

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

  const ensurePool = (pool: ListingItem[]) => (pool.length ? pool : fallback);
  const topPool = ensurePool(tops);
  const bottomPool = ensurePool(bottoms);
  const shoePool = ensurePool(footwear);

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
  }, [baseItem, pickedTop, pickedBottom, pickedShoe]);

  const accessoryOptions = useMemo(() => {
    const selectedSet = new Set(baseOutfitItems.map((item) => item.id));
    const filtered = accessories.filter((item) => !selectedSet.has(item.id));
    if (filtered.length) return filtered;
    const fallbackFiltered = fallback.filter(
      (item) => !selectedSet.has(item.id)
    );
    return fallbackFiltered.length ? fallbackFiltered : accessories;
  }, [accessories, fallback, baseOutfitItems]);

  useEffect(() => {
    setSelectedAccessoryIds((prev) => {
      const next = prev.filter((id) =>
        accessoryOptions.some((item) => item.id === id)
      );
      if (next.length === prev.length && next.every((id, i) => id === prev[i])) {
        return prev;
      }
      return next;
    });
  }, [accessoryOptions]);

  const selectedAccessoryItems = useMemo(() => {
    if (!selectedAccessoryIds.length) return [];
    return accessoryOptions.filter((item) =>
      selectedAccessoryIds.includes(item.id)
    );
  }, [accessoryOptions, selectedAccessoryIds]);

  const selection: BagItem[] = useMemo(() => {
    const unique = new Map<string, ListingItem>();
    baseOutfitItems.forEach((item) => unique.set(item.id, item));
    selectedAccessoryItems.forEach((item) => unique.set(item.id, item));
    return Array.from(unique.values()).map((item) => ({ item, quantity: 1 }));
  }, [baseOutfitItems, selectedAccessoryItems]);

  const toggleLike = (id: string) =>
    setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleAccessorySelect = (id: string) =>
    setSelectedAccessoryIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );

  const openListing = (item: ListingItem) =>
    navigation.navigate("ListingDetail", { item });

  const dismissTip = () => {
    bounceAnimRef.current?.stop();
    bounceAnimRef.current = null;
    fadeAnimRef.current?.stop();
    fadeAnimRef.current = null;
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
    if (hardHideTimeoutRef.current) {
      clearTimeout(hardHideTimeoutRef.current);
      hardHideTimeoutRef.current = null;
    }
    Animated.timing(tipOpacity, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => setTipVisible(false));
  };

  const handleTipPress = () => {
    scrollRef.current?.scrollTo({ y: 360, animated: true });
    dismissTip();
  };

  const viewTop = pickedTop ?? (baseCategory === "Tops" ? baseItem : null);
  const viewBottom = pickedBottom ?? (baseCategory === "Bottoms" ? baseItem : null);
  const viewShoe = pickedShoe ?? (baseCategory === "Footwear" ? baseItem : null);

  const navigateToViewOutfit = useCallback(() => {
    navigation.navigate("ViewOutfit", {
      baseItem,
      top: viewTop,
      bottom: viewBottom,
      shoe: viewShoe,
      accessories: selectedAccessoryItems,
      selection,
    });
  }, [navigation, baseItem, viewTop, viewBottom, viewShoe, selectedAccessoryItems, selection]);

  const slotConfigs = [
    {
      key: "tops" as const,
      label: "TOP",
      isBase: baseCategory === "Tops",
      pool: topPool,
      index: topIndex,
      setIndex: setTopIndex,
      picked: pickedTop,
      frameW: TB_W,
      frameH: TB_H,
      imageMode: "contain" as const,
    },
    {
      key: "bottoms" as const,
      label: "BOTTOM",
      isBase: baseCategory === "Bottoms",
      pool: bottomPool,
      index: bottomIndex,
      setIndex: setBottomIndex,
      picked: pickedBottom,
      frameW: TB_W,
      frameH: TB_H,
      imageMode: "contain" as const,
    },
    {
      key: "footwear" as const,
      label: "SHOES",
      isBase: baseCategory === "Footwear",
      pool: shoePool,
      index: shoeIndex,
      setIndex: setShoeIndex,
      picked: pickedShoe,
      frameW: SH_W,
      frameH: SH_H,
      imageMode: "cover" as const,
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header
        title="Mix & Match"
        showBack
        rightAction={
          <TouchableOpacity
            // navigate without passing the current selection
            onPress={() => navigation.navigate("Bag")}
          >
            <Icon name="bag-outline" size={24} color="#111" />
          </TouchableOpacity>
        }
      />

      {tipVisible && (
        <Animated.View
          style={[
            styles.swipeTip,
            {
              transform: [{ translateY: tipTranslateY }],
              opacity: tipOpacity,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleTipPress}
            style={styles.swipeTipRow}
          >
            <Icon name="chevron-down" size={14} color="#fff" />
            <Text style={styles.swipeTipText}>Swipe down for more combos</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {slotConfigs.map((slot) => (
          <View key={slot.key} style={styles.slotSection}>
            <View style={styles.slotHeader}>
              <Text style={styles.slotLabel}>{slot.label}</Text>
              <Text style={styles.slotHint}>
                {slot.isBase ? "Locked item" : "Swipe to switch"}
              </Text>
            </View>
            {slot.isBase && slot.picked ? (
              <View style={styles.fixedCardWrapper}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => openListing(slot.picked!)}
                >
                  <FrameCardContent
                    item={slot.picked}
                    frameW={slot.frameW}
                    frameH={slot.frameH}
                    liked={likedMap[slot.picked.id]}
                    onToggleLike={toggleLike}
                    imageMode={slot.imageMode}
                    badgeLabel="CURRENT"
                    isActive
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <FrameCarousel
                items={slot.pool}
                index={slot.index}
                onIndexChange={slot.setIndex}
                likedMap={likedMap}
                onToggleLike={toggleLike}
                onOpen={openListing}
                frameW={slot.frameW}
                frameH={slot.frameH}
                imageMode={slot.imageMode}
              />
            )}
          </View>
        ))}
        <View style={styles.slotSection}>
          <View style={styles.slotHeader}>
            <Text style={styles.slotLabel}>ACCESSORIES</Text>
            <Text style={styles.slotHint}>Complete the look</Text>
          </View>
          <View style={styles.accessoryGrid}>
            {accessoryOptions.map((item, index) => {
              const isSelected = selectedAccessoryIds.includes(item.id);
              const isLastInRow = (index + 1) % ACCESSORY_COLUMNS === 0;
              return (
                <View
                  key={item.id}
                  style={[
                    styles.accessoryCardWrapper,
                    !isLastInRow ? styles.accessoryCardSpacer : null,
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => openListing(item)}
                  >
                    <FrameCardContent
                      item={item}
                      frameW={ACC_W}
                      frameH={ACC_H}
                      liked={likedMap[item.id]}
                      onToggleLike={toggleLike}
                      imageMode="cover"
                      selectable
                      selected={isSelected}
                      onSelectPress={() => toggleAccessorySelect(item.id)}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomButtonLeft}
          onPress={navigateToViewOutfit}
          activeOpacity={0.85}
          accessibilityLabel="View outfit fullscreen"
        >
          <Text style={styles.bottomButtonText}>View Outfit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomButtonRight}
          onPress={() => navigation.navigate("Bag", { items: selection })}
        >
          <Text style={styles.bottomButtonPrimaryText}>Add All To Bag</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FrameCardContent({
  item,
  frameW,
  frameH,
  liked,
  onToggleLike,
  imageMode,
  badgeLabel,
  isActive,
  selectable,
  selected,
  onSelectPress,
}: {
  item: ListingItem;
  frameW: number;
  frameH: number;
  liked: boolean | undefined;
  onToggleLike: (id: string) => void;
  imageMode: "contain" | "cover";
  badgeLabel?: string;
  isActive?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelectPress?: () => void;
}) {
  return (
    <View
      style={[
        styles.frame,
        { width: frameW, height: frameH },
        isActive || selected ? styles.frameActive : null,
      ]}
    >
      <Image
        source={{ uri: item.images[0] }}
        style={styles.frameImage}
        resizeMode={imageMode}
      />
      <Text style={styles.priceTag}>${item.price.toFixed(0)}</Text>
      {selectable ? (
        <TouchableOpacity
          style={[
            styles.selectTag,
            selected ? styles.selectTagActive : null,
          ]}
          onPress={onSelectPress || (() => {})}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.selectTagText,
              selected ? styles.selectTagTextActive : null,
            ]}
          >
            {selected ? "Selected" : "Select"}
          </Text>
        </TouchableOpacity>
      ) : badgeLabel ? (
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      ) : null}
      <TouchableOpacity
        onPress={() => onToggleLike(item.id)}
        style={styles.heartBtn}
      >
        <Icon
          name={liked ? "heart" : "heart-outline"}
          size={22}
          color={liked ? "#F54B3D" : "#111"}
        />
      </TouchableOpacity>
    </View>
  );
}

/** Horizontal carousel with gradient edges */
function FrameCarousel({
  items,
  index,
  onIndexChange,
  likedMap,
  onToggleLike,
  onOpen,
  frameW,
  frameH,
  imageMode,
}: {
  items: ListingItem[];
  index: number;
  onIndexChange: (i: number) => void;
  likedMap: Record<string, boolean>;
  onToggleLike: (id: string) => void;
  onOpen: (item: ListingItem) => void;
  frameW: number;
  frameH: number;
  imageMode: "contain" | "cover";
}) {
  const listRef = useRef<FlatList<ListingItem>>(null);

  const activeIndex = items.length ? Math.min(index, items.length - 1) : 0;

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const page = Math.round(x / (frameW + GAP));
    if (page !== index) onIndexChange(page);
  };

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      if (viewableItems[0]?.index != null) {
        onIndexChange(viewableItems[0].index);
      }
    }
  ).current;

  const canPrev = activeIndex > 0;
  const canNext = activeIndex < (items?.length ?? 0) - 1;

  // Row-specific padding to keep the first and last cards centered
  const availableWidth = Math.max(frameW, width - H_PADDING * 2);
  const sidePadding = Math.max(0, Math.floor((availableWidth - frameW) / 2));

  const scrollTo = (i: number) => {
    try {
      listRef.current?.scrollToIndex({ index: i, animated: true });
    } catch {
      // Fallback: scroll by card width so the target card centers
      const offset = i * (frameW + GAP);
      listRef.current?.scrollToOffset({ offset, animated: true });
    }
  };

  const goPrev = () => {
    if (!canPrev) return;
    const nextIdx = activeIndex - 1;
    onIndexChange(nextIdx);
    scrollTo(nextIdx);
  };
  const goNext = () => {
    if (!canNext) return;
    const nextIdx = activeIndex + 1;
    onIndexChange(nextIdx);
    scrollTo(nextIdx);
  };

  return (
    <View style={styles.carouselWrap}>
      <FlatList
        ref={listRef}
        horizontal
        data={items}
        keyExtractor={(it) => it.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={frameW + GAP}
        decelerationRate="fast"
        bounces={false}
        initialScrollIndex={activeIndex}
        getItemLayout={(_, i) => ({
          length: frameW + GAP,
          // Avoid padding in offset so scrollToIndex centers the card
          offset: i * (frameW + GAP),
          index: i,
        })}
        contentContainerStyle={{
          paddingHorizontal: sidePadding,
          // tighter vertical padding around the carousel
          paddingTop: 8,
          paddingBottom: 8,
        }}
        ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
        onMomentumScrollEnd={onMomentumEnd}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        renderItem={({ item, index: itemIndex }) => (
          <TouchableOpacity activeOpacity={0.9} onPress={() => onOpen(item)}>
            <FrameCardContent
              item={item}
              frameW={frameW}
              frameH={frameH}
              liked={likedMap[item.id]}
              onToggleLike={onToggleLike}
              imageMode={imageMode}
              badgeLabel={itemIndex === activeIndex ? "SELECTED" : undefined}
              isActive={itemIndex === activeIndex}
            />
          </TouchableOpacity>
        )}
      />

      {/* Gradient edges with arrows, only when navigation is possible */}
      {canPrev && (
        <TouchableOpacity
          style={[styles.edgeMask, { left: 0 }]}
          activeOpacity={0.8}
          onPress={goPrev}
          hitSlop={{ left: 6, right: 6, top: 6, bottom: 6 }}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.98)", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.edgeMaskBg}
          />
          <Icon name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>
      )}
      {canNext && (
        <TouchableOpacity
          style={[styles.edgeMask, { right: 0 }]}
          activeOpacity={0.8}
          onPress={goNext}
          hitSlop={{ left: 6, right: 6, top: 6, bottom: 6 }}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.98)"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.edgeMaskBg}
          />
          <Icon name="chevron-forward" size={22} color="#111" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 80,
    rowGap: 28,
    paddingHorizontal: H_PADDING,
  },
  slotSection: {
    rowGap: 12,
    alignItems: "stretch",
  },
  slotHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slotLabel: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  slotHint: {
    fontSize: 12,
    color: "#7a7a7a",
  },
  fixedCardWrapper: {
    alignItems: "center",
    width: "100%",
  },
  accessoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  accessoryCardWrapper: {
    width: ACC_W,
    marginBottom: ACCESSORY_GAP,
  },
  accessoryCardSpacer: {
    marginRight: ACCESSORY_GAP,
  },
  carouselWrap: {
    position: "relative",
    width: Math.max(FRAME_W, width - H_PADDING * 2),
    alignSelf: "center",
  },
  frame: {
    width: FRAME_W,
    height: FRAME_H,
    borderWidth: 1,
    borderColor: "#d5d5d5",
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  frameActive: {
    borderColor: "#111",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  frameImage: {
    width: "100%",
    height: "100%",
  },
  priceTag: {
    position: "absolute",
    top: 4,
    left: 4,
    fontSize: 16,
    fontWeight: "800",
    zIndex: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.92)",
    color: "#111",
  },
  badgePill: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#111",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  selectTag: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#d5d5d5",
  },
  selectTagActive: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  selectTagText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#111",
    letterSpacing: 0.4,
  },
  selectTagTextActive: {
    color: "#fff",
  },
  heartBtn: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  edgeMask: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  edgeMaskBg: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
    flexDirection: "row",
    columnGap: 12,
  },
  bottomButtonLeft: {
    flex: 1,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: "#fff",
  },
  bottomButtonRight: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  bottomButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  bottomButtonPrimaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  swipeTip: {
    position: "absolute",
    bottom: 110,
    alignSelf: "center",
    backgroundColor: "#111",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    zIndex: 12,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
  },
  swipeTipRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  swipeTipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
    marginLeft: 6,
  },
  secondaryButton: {
    flex: 1,
    marginRight: 12,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#111",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  bottomButton: {
    flex: 1,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  shareSpinnerWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  addToBagButton: {
    marginLeft: 12,
  },
});
