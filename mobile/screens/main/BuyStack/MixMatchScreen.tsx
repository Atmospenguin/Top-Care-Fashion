import React, { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
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

import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import type { ListingItem, BagItem } from "../../../types/shop";
import { MOCK_LISTINGS } from "../../../mocks/shop";
import type { BuyStackParamList } from "./index";

const { width } = Dimensions.get("window");
const GAP = 12; // 卡片之间的间距
const FRAME_W = Math.floor(width * 0.61);
const FRAME_H = Math.floor(FRAME_W);
// 顶部/下装稍微放大尺寸（按你的反馈再小一点）
const TB_W = Math.floor(width * 0.61);
const TB_H = Math.floor(TB_W);
// 鞋子：矮的长方形
const SH_W = Math.floor(width * 0.61);
const SH_H = Math.floor(SH_W * 0.56);

function findMatches(base: ListingItem) {
  const others = MOCK_LISTINGS.filter((item) => item.id !== base.id);
  const tops = others.filter((item) =>
    /hoodie|jacket|top|shirt|sweater|blouse/i.test(item.title)
  );
  const bottoms = others.filter((item) =>
    /skirt|pant|trouser|jean|short/i.test(item.title)
  );
  const shoes = others.filter((item) =>
    /shoe|sneaker|boot|heel/i.test(item.title)
  );
  const fallback = others.length ? others : [base];
  return {
    top: tops.length ? tops : fallback,
    bottom: bottoms.length ? bottoms : fallback,
    shoe: shoes.length ? shoes : fallback,
  };
}

export default function MixMatchScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<BuyStackParamList>>();
  const route = useRoute<RouteProp<BuyStackParamList, "MixMatch">>();
  const baseItem = route.params.baseItem;

  const pools = useMemo(() => findMatches(baseItem), [baseItem.id]);

  const [topIndex, setTopIndex] = useState(0);
  const [bottomIndex, setBottomIndex] = useState(0);
  const [shoeIndex, setShoeIndex] = useState(0);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  const pickedTop = pools.top[topIndex % pools.top.length];
  const pickedBottom = pools.bottom[bottomIndex % pools.bottom.length];
  const pickedShoe = pools.shoe[shoeIndex % pools.shoe.length];

  const selection: BagItem[] = useMemo(() => {
    const items: ListingItem[] = [baseItem];
    if (pickedTop) items.unshift(pickedTop);
    if (pickedBottom) items.push(pickedBottom);
    if (pickedShoe) items.push(pickedShoe);
    return items.map((item) => ({ item, quantity: 1 }));
  }, [baseItem, pickedTop, pickedBottom, pickedShoe]);

  const toggleLike = (id: string) =>
    setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }));

  const openListing = (item: ListingItem) =>
    navigation.navigate("ListingDetail", { item });

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header
        title="Mix & Match"
        showBack
        rightAction={
          <TouchableOpacity
            // ✅ 仅跳转，不传当前 selection
            onPress={() => navigation.navigate("Bag")}
          >
            <Icon name="bag-outline" size={24} color="#111" />
          </TouchableOpacity>
        }
      />

      {/* 居中展示三行，不使用垂直滚动 */}
      <View style={styles.framesContainer}>
        <FrameCarousel
          items={pools.top}
          index={topIndex}
          onIndexChange={setTopIndex}
          likedMap={likedMap}
          onToggleLike={toggleLike}
          onOpen={openListing}
          frameW={TB_W}
          frameH={TB_H}
          imageMode="contain"
        />
        <FrameCarousel
          items={pools.bottom}
          index={bottomIndex}
          onIndexChange={setBottomIndex}
          likedMap={likedMap}
          onToggleLike={toggleLike}
          onOpen={openListing}
          frameW={TB_W}
          frameH={TB_H}
          imageMode="contain"
        />
        <FrameCarousel
          items={pools.shoe}
          index={shoeIndex}
          onIndexChange={setShoeIndex}
          likedMap={likedMap}
          onToggleLike={toggleLike}
          onOpen={openListing}
          frameW={SH_W}
          frameH={SH_H}
          imageMode="cover"
        />
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate("Bag", { items: selection })}
        >
          <Text style={styles.primaryText}>Add All To Bag</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** 单行横向 Carousel（左右半透明渐变边缘） */
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

  const canPrev = index > 0;
  const canNext = index < (items?.length ?? 0) - 1;

  // 行内专属边距，确保首尾元素居中
  const sidePadding = Math.max(0, Math.floor((width - frameW) / 2));

  const scrollTo = (i: number) => {
    try {
      listRef.current?.scrollToIndex({ index: i, animated: true });
    } catch {
      // 直接按单卡宽度+间距计算，使目标卡片居中（与 snap + padding 对齐）
      const offset = i * (frameW + GAP);
      listRef.current?.scrollToOffset({ offset, animated: true });
    }
  };

  const goPrev = () => {
    if (!canPrev) return;
    const nextIdx = index - 1;
    onIndexChange(nextIdx);
    scrollTo(nextIdx);
  };
  const goNext = () => {
    if (!canNext) return;
    const nextIdx = index + 1;
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
        initialScrollIndex={index}
        getItemLayout={(_, i) => ({
          length: frameW + GAP,
          // 不把 padding 计入 offset，确保 scrollToIndex 精确落到卡片居中位置
          offset: i * (frameW + GAP),
          index: i,
        })}
        contentContainerStyle={{
          paddingHorizontal: sidePadding,
          // 上下内边距减半
          paddingTop: 8,
          paddingBottom: 8,
        }}
        ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
        onMomentumScrollEnd={onMomentumEnd}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.9} onPress={() => onOpen(item)}>
            <View style={[styles.frame, { width: frameW, height: frameH }]}>
              <Image
                source={{ uri: item.images[0] }}
                style={styles.frameImage}
                resizeMode={imageMode}
              />
              {/* 价格置顶，不被图片遮挡 */}
              <Text style={styles.priceTag}>${item.price.toFixed(0)}</Text>
              <TouchableOpacity
                onPress={() => onToggleLike(item.id)}
                style={styles.heartBtn}
              >
                <Icon
                  name={likedMap[item.id] ? "heart" : "heart-outline"}
                  size={22}
                  color={likedMap[item.id] ? "#F54B3D" : "#111"}
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* 左右渐变遮罩 + 箭头，仅在有可切换项时显示 */}
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
  framesContainer: {
    flex: 1,
    justifyContent: "center", // 三行垂直居中
    // 预留底部按钮空间，避免被遮挡
    paddingBottom: 90,
  },
  carouselWrap: {
    position: "relative",
    // 行间距缩小（相对之前 paddingTop/paddingBottom 的一半）
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
    paddingVertical: 20,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
  },
  primaryButton: {
    backgroundColor: "#111",
    borderRadius: 28,
    alignItems: "center",
    paddingVertical: 16,
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
