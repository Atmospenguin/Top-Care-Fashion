import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import type { BuyStackParamList } from "./index";
import {
  DEFAULT_PAYMENT_METHOD,
  DEFAULT_SHIPPING_ADDRESS,
} from "../../../mocks/shop";

function formatAddress() {
  const parts = [DEFAULT_SHIPPING_ADDRESS.line1];
  if (DEFAULT_SHIPPING_ADDRESS.line2) parts.push(DEFAULT_SHIPPING_ADDRESS.line2);
  parts.push(
    `${DEFAULT_SHIPPING_ADDRESS.city}, ${DEFAULT_SHIPPING_ADDRESS.state} ${DEFAULT_SHIPPING_ADDRESS.postalCode}`,
  );
  parts.push(DEFAULT_SHIPPING_ADDRESS.country);
  return parts.join("\n");
}

function getDeliveryEstimate(): string {
  const today = new Date();
  const delivery = new Date(today);
  delivery.setDate(delivery.getDate() + 7);
  return delivery.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function CheckoutScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<BuyStackParamList>>();
  const {
    params: { items, subtotal, shipping },
  } = useRoute<RouteProp<BuyStackParamList, "Checkout">>();

  const total = useMemo(() => subtotal + shipping, [subtotal, shipping]);
  const deliveryEstimate = useMemo(() => getDeliveryEstimate(), []);

  return (
    <View style={styles.screen}>
      <Header title="Checkout" showBack />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            <TouchableOpacity accessibilityRole="button">
              <Text style={styles.sectionAction}>Change</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.addressName}>{DEFAULT_SHIPPING_ADDRESS.name}</Text>
          <Text style={styles.addressPhone}>{DEFAULT_SHIPPING_ADDRESS.phone}</Text>
          <Text style={styles.addressBody}>{formatAddress()}</Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <TouchableOpacity accessibilityRole="button">
              <Text style={styles.sectionAction}>Change</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.paymentRow}>
            <Icon name="card" size={20} color="#111" />
            <Text style={styles.paymentText}>
              {DEFAULT_PAYMENT_METHOD.brand} ending in {DEFAULT_PAYMENT_METHOD.last4}
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <Text style={styles.summaryItems}>{items.length} items</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>${shipping.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated Delivery</Text>
            <Text style={styles.summaryValue}>{deliveryEstimate}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotal}>Total</Text>
            <Text style={styles.summaryTotal}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            navigation.navigate("Purchase", {
              orderId: `TOP-${Math.floor(Math.random() * 9000 + 1000)}`,
              total,
              estimatedDelivery: deliveryEstimate,
              items,
            })
          }
        >
          <Text style={styles.primaryText}>Place order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: {
    padding: 16,
    rowGap: 16,
    paddingBottom: 120,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#eee",
    rowGap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2A7BF4",
  },
  addressName: {
    fontSize: 15,
    fontWeight: "600",
  },
  addressPhone: {
    fontSize: 13,
    color: "#666",
  },
  addressBody: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    marginTop: 4,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
  },
  paymentText: {
    fontSize: 14,
    fontWeight: "600",
  },
  summaryItems: {
    fontSize: 13,
    color: "#666",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: { fontSize: 14, color: "#666" },
  summaryValue: { fontSize: 14, fontWeight: "600" },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#ddd",
    marginVertical: 8,
  },
  summaryTotal: { fontSize: 16, fontWeight: "700" },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
  },
  primaryButton: {
    backgroundColor: "#111",
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
