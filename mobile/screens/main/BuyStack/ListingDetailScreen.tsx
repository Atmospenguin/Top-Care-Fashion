import React, { useMemo } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import type { BagItem } from "../../../types/shop";
import type { BuyStackParamList } from "./index";

const { width: WINDOW_WIDTH } = Dimensions.get("window");
const IMAGE_SIZE = Math.min(WINDOW_WIDTH - 48, 360);

export default function ListingDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<BuyStackParamList>>();
  const {
    params: { item },
  } = useRoute<RouteProp<BuyStackParamList, "ListingDetail">>();

  const defaultBag = useMemo<BagItem[]>(
    () => [{ item, quantity: 1 }],
    [item],
  );
  const subtotal = useMemo(
    () => defaultBag.reduce((sum, current) => sum + current.item.price * current.quantity, 0),
    [defaultBag],
  );
  const shippingFee = 8;

  return (
    <View style={styles.screen}>
      <Header
        title=""
        showBack
        rightAction={
          <TouchableOpacity
            onPress={() => navigation.navigate("MixMatch", { baseItem: item })}
          >
            <Icon name="color-palette-outline" size={22} color="#111" />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.container}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imageCarousel}
        >
          {item.images.map((uri: string, index: number) => (
            <Image
              key={`${item.id}-${index}`}
              source={{ uri }}
              style={styles.image}
            />
          ))}
        </ScrollView>

        <View style={styles.sectionCard}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.price}>${item.price.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.iconButton}
            >
              <Icon name="heart-outline" size={22} color="#111" />
            </TouchableOpacity>
            {/* Mix & Match chip aligned with like icon and same height */}
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.mixChipBtn}
              onPress={() => navigation.navigate("MixMatch", { baseItem: item })}
            >
              <Text style={styles.mixChipText}>Mix & Match</Text>
            </TouchableOpacity>

          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaLabel}>Size</Text>
              <Text style={styles.metaValue}>{item.size}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaLabel}>Condition</Text>
              <Text style={styles.metaValue}>{item.condition}</Text>
            </View>
          </View>
          <Text style={styles.description}>{item.description}</Text>

          <View style={styles.attributeRow}>
            <View style={styles.attributeBlock}>
              <Text style={styles.attributeLabel}>Brand</Text>
              <Text style={styles.attributeValue}>{item.brand}</Text>
            </View>
            {item.material ? (
              <View style={styles.attributeBlock}>
                <Text style={styles.attributeLabel}>Material</Text>
                <Text style={styles.attributeValue}>{item.material}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.colorsRow}>
            {item.colors.map((color: string) => (
              <Text key={color} style={styles.colorChip}>
                {color}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Seller</Text>
          <View style={styles.sellerRow}>
            <Image source={{ uri: item.seller.avatar }} style={styles.sellerAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sellerName}>{item.seller.name}</Text>
              <Text style={styles.sellerMeta}>
                {item.seller.rating.toFixed(1)} stars | {item.seller.sales} sales
              </Text>
            </View>
            <TouchableOpacity style={styles.messageBtn}>
              <Icon name="chatbubble-ellipses-outline" size={18} color="#000" />
              <Text style={styles.messageText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Shipping & Returns</Text>
          <Text style={styles.description}>
            Ships within 2 business days from New York, USA. Trackable shipping is included.
            Returns accepted within 7 days of delivery.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("Bag", { items: defaultBag })}
        >
          <Icon name="bag-add-outline" size={20} color="#111" />
          <Text style={styles.secondaryText}>Add to Bag</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            navigation.navigate("Checkout", {
              items: defaultBag,
              subtotal,
              shipping: shippingFee,
            })
          }
        >
          <Text style={styles.primaryText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: {
    paddingBottom: 120,
    rowGap: 16,
  },
  imageCarousel: {
    columnGap: 12,
    paddingHorizontal: 16,
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 16,
    backgroundColor: "#f2f2f2",
  },
  sectionCard: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
    rowGap: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
  },
  title: { fontSize: 20, fontWeight: "700" },
  price: { fontSize: 18, fontWeight: "700", color: "#111" },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  mixChipBtn: {
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#111",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  mixChipText: { fontSize: 13, fontWeight: "700", color: "#111" },
  metaRow: {
    flexDirection: "row",
    columnGap: 12,
  },
  metaPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f6f6f6",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 12,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: { fontSize: 14, fontWeight: "600", color: "#111", marginTop: 4 },
  description: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  attributeRow: {
    flexDirection: "row",
    columnGap: 16,
  },
  attributeBlock: { flex: 1 },
  attributeLabel: {
    fontSize: 12,
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  attributeValue: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 4,
  },
  colorsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  colorChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f0f0f0",
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
  },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e8e8e8",
  },
  sellerName: {
    fontSize: 15,
    fontWeight: "600",
  },
  sellerMeta: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  messageText: {
    fontSize: 13,
    fontWeight: "600",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 8,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#111",
    marginRight: 12,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
