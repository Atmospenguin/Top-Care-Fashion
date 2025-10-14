import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import type { MyTopStackParamList } from "./index";

type Nav = NativeStackNavigationProp<MyTopStackParamList, "MyBoostListings">;

const MOCK_ACTIVE: Array<{
  id: string;
  title: string;
  price: number;
  image: string;
  boosted?: boolean;
  oldPrice?: number;
}> = [
  {
    id: "a1",
    title: "Brandy top",
    price: 50,
    image:
      "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "a2",
    title: "White lace blouse",
    price: 55,
    image:
      "https://images.unsplash.com/photo-1520975922284-5cb56b85c0a0?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "a3",
    title: "Green trousers",
    price: 25.5,
    image:
      "https://images.unsplash.com/photo-1592878904946-b3cd6fd7d9f7?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "a4",
    title: "Blue dress",
    price: 23.5,
    image:
      "https://images.unsplash.com/photo-1520975652208-8bdf0a1a3f3c?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "a5",
    title: "Cream cardigan",
    price: 25.5,
    image:
      "https://images.unsplash.com/photo-1520975661595-645b57a5329b?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "a6",
    title: "Bucket hat (boosted)",
    price: 33,
    boosted: true,
    image:
      "https://images.unsplash.com/photo-1593030761757-71b4c1b1ff0e?q=80&w=600&auto=format&fit=crop",
  },
  // 再补几张占位
  {
    id: "a7",
    title: "Brown jacket",
    price: 45,
    image:
      "https://images.unsplash.com/photo-1520975867597-0f4a4e9a9f00?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "a8",
    title: "Cross-body bag",
    price: 40,
    image:
      "https://images.unsplash.com/photo-1576485436509-cf4b2c2f58b1?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "a9",
    title: "Brown shirt",
    price: 31,
    image:
      "https://images.unsplash.com/photo-1520976307980-4d8b4d4f6b6d?q=80&w=600&auto=format&fit=crop",
  },
];

export default function BoostListingScreen() {
  const navigation = useNavigation<Nav>();
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected]
  );

  const toggle = (id: string) =>
    setSelected((s) => ({ ...s, [id]: !s[id] }));

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title="Boost listings" showBack />

      {/* 顶部统计卡：点击进入已 Boost 列表页 */}
      <TouchableOpacity
        style={styles.topCard}
  onPress={() => navigation.navigate("BoostedListing")}
        activeOpacity={0.9}
      >
        <View style={styles.rowCenter}>
          <Icon name="flash-outline" size={18} color="#111" />
          <Text style={styles.topCardTitle}>
            {"  "}
            2 live boosted listings
          </Text>
        </View>
        <Icon name="chevron-forward" size={18} color="#666" />
      </TouchableOpacity>

      <Text style={styles.sectionHint}>Select listings to boost</Text>

      <FlatList
        data={MOCK_ACTIVE}
        keyExtractor={(item) => item.id}
        numColumns={3}
  contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 100 }}
  columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
        renderItem={({ item }) => {
          const isSelected = !!selected[item.id];
          return (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => toggle(item.id)}
              style={styles.card}
            >
              <Image source={{ uri: item.image }} style={styles.cardImg} />
              {/* 右上角选择圆点 */}
              <View
                style={[
                  styles.checkDot,
                  isSelected && { borderColor: "#111" },
                ]}
              >
                {isSelected ? <View style={styles.checkDotInner} /> : null}
              </View>
              {/* Boosted 贴纸 */}
              {item.boosted && (
                <View style={styles.boostBadge}>
                  <Text style={styles.boostBadgeText}>Boosted</Text>
                </View>
              )}

              <View style={{ padding: 6 }}>
                <Text numberOfLines={1} style={styles.priceText}>
                  £{item.price.toFixed(2)}
                </Text>
                {!!item.oldPrice && (
                  <Text style={styles.oldPrice}>£{item.oldPrice.toFixed(2)}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* 底部按钮 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            selectedCount === 0 && { opacity: 0.4 },
          ]}
          disabled={selectedCount === 0}
          onPress={() => navigation.navigate("PromotionPlans")}
        >
          <Text style={styles.primaryText}>
            Boost selected ({selectedCount})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  rowCenter: { flexDirection: "row", alignItems: "center" },
  topCardTitle: { fontSize: 15, fontWeight: "700", color: "#111" },
  sectionHint: {
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
    color: "#666",
    fontWeight: "600",
  },
  card: {
    flex: 1,
    aspectRatio: 0.78,
    backgroundColor: "#f6f6f6",
    borderRadius: 12,
    overflow: "hidden",
  },
  cardImg: { width: "100%", height: "70%" },
  checkDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  checkDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#111",
  },
  boostBadge: {
    position: "absolute",
    bottom: 38,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  boostBadgeText: { color: "#fff", fontWeight: "800" },
  priceText: { fontWeight: "700", color: "#111" },
  oldPrice: {
    marginTop: 2,
    color: "#9b9b9b",
    textDecorationLine: "line-through",
    fontSize: 12,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
  },
  primaryBtn: {
    backgroundColor: "#111",
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
