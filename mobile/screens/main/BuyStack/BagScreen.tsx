import React, { useMemo } from "react";
import {
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
import type { BuyStackParamList } from "./index";
import type { HomeStackParamList } from "../HomeStack";
import { DEFAULT_BAG_ITEMS } from "../../../mocks/shop";

export default function BagScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<BuyStackParamList>>();
  const route = useRoute<RouteProp<BuyStackParamList, "Bag">>();

  const items = route.params?.items ?? DEFAULT_BAG_ITEMS;

  const { subtotal, shipping, total } = useMemo(() => {
    const computedSubtotal = items.reduce(
      (sum, current) => sum + current.item.price * current.quantity,
      0,
    );
    const shippingFee = items.length > 0 ? 8 : 0;
    return {
      subtotal: computedSubtotal,
      shipping: shippingFee,
      total: computedSubtotal + shippingFee,
    };
  }, [items]);

  return (
    <View style={styles.screen}>
      <Header title="My Bag" showBack />

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="bag-handle-outline" size={42} color="#bbb" />
          <Text style={styles.emptyTitle}>Your bag is empty</Text>
          <Text style={styles.emptySubtitle}>Add items to see them appear here.</Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => {
              const parent = (navigation as any).getParent?.();
              if (parent?.reset) {
                parent.reset({
                  index: 0,
                  routes: [
                    { name: "Main", params: { screen: "Home", params: { screen: "HomeMain" } } },
                  ],
                });
              } else {
                parent?.navigate?.("Main", { screen: "Home", params: { screen: "HomeMain" } });
              }
            }}
          >
            <Text style={styles.exploreText}>Explore listings</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.itemsCard}>
            {items.map(({ item, quantity }) => (
              <View key={`${item.id}`} style={styles.itemRow}>
                <Image source={{ uri: item.images[0] }} style={styles.itemImage} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemMeta}>
                    Size {item.size} | {item.condition}
                  </Text>
                  <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                </View>
                <View style={styles.quantityBadge}>
                  <Text style={styles.quantityText}>x{quantity}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>${shipping.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotal}>Total</Text>
              <Text style={styles.summaryTotal}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {items.length > 0 ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              const parent = (navigation as any).getParent?.();
              if (parent?.reset) {
                parent.reset({
                  index: 0,
                  routes: [
                    { name: "Main", params: { screen: "Home", params: { screen: "HomeMain" } } },
                  ],
                });
              } else {
                parent?.navigate?.("Main", { screen: "Home", params: { screen: "HomeMain" } });
              }
            }}
          >
            <Text style={styles.secondaryText}>Continue browsing</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              navigation.navigate("Checkout", {
                items,
                subtotal,
                shipping,
              })
            }
          >
            <Text style={styles.primaryText}>Proceed to checkout</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: {
    padding: 16,
    rowGap: 16,
    paddingBottom: 140,
  },
  itemsCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eee",
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    padding: 16,
    columnGap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  itemImage: {
    width: 76,
    height: 84,
    borderRadius: 12,
    backgroundColor: "#f4f4f4",
  },
  itemInfo: { flex: 1, rowGap: 4 },
  itemTitle: { fontSize: 15, fontWeight: "600" },
  itemMeta: { fontSize: 13, color: "#666" },
  itemPrice: { fontSize: 15, fontWeight: "700", marginTop: 4 },
  quantityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f1f1f1",
  },
  quantityText: { fontSize: 13, fontWeight: "600" },
  summaryCard: {
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
    rowGap: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: { fontSize: 14, color: "#555" },
  summaryValue: { fontSize: 14, fontWeight: "600" },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#ddd",
  },
  summaryTotal: { fontSize: 16, fontWeight: "700" },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    columnGap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  secondaryText: { fontSize: 14, fontWeight: "600", color: "#111" },
  primaryButton: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  primaryText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    rowGap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#222" },
  emptySubtitle: { fontSize: 14, color: "#666", textAlign: "center" },
  exploreBtn: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "#111",
  },
  exploreText: { color: "#fff", fontWeight: "700" },
});
