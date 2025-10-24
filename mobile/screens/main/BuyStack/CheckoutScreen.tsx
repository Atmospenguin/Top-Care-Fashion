import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput, Alert } from "react-native";
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
import { ordersService } from "../../../src/services";
import { useAuth } from "../../../contexts/AuthContext";

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
  const { user } = useAuth();

  // 🔥 状态管理 - 地址和付款方式
  const [shippingAddress, setShippingAddress] = useState(DEFAULT_SHIPPING_ADDRESS);
  const [paymentMethod, setPaymentMethod] = useState(DEFAULT_PAYMENT_METHOD);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const total = useMemo(() => subtotal + shipping, [subtotal, shipping]);
  const deliveryEstimate = useMemo(() => getDeliveryEstimate(), []);

  // 🔥 格式化地址函数
  const formatCurrentAddress = () => {
    const parts = [shippingAddress.line1];
    if (shippingAddress.line2) parts.push(shippingAddress.line2);
    parts.push(
      `${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}`,
    );
    parts.push(shippingAddress.country);
    return parts.join("\n");
  };

  // 🔥 编辑地址功能
  const handleChangeAddress = () => {
    Alert.prompt(
      "Edit Shipping Address",
      "Enter your address:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: (address) => {
            if (address) {
              setShippingAddress({
                ...shippingAddress,
                line1: address
              });
            }
          }
        }
      ],
      "plain-text",
      shippingAddress.line1
    );
  };

  // 🔥 编辑付款方式功能
  const handleChangePayment = () => {
    Alert.prompt(
      "Edit Payment Method",
      "Enter card number (last 4 digits):",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: (last4) => {
            if (last4 && last4.length === 4) {
              setPaymentMethod({
                ...paymentMethod,
                last4: last4
              });
            }
          }
        }
      ],
      "plain-text",
      paymentMethod.last4
    );
  };

  // 🔥 创建真实订单
  const handlePlaceOrder = async () => {
    if (!user) {
      Alert.alert("Error", "Please log in to place an order");
      return;
    }

    try {
      setIsCreatingOrder(true);
      
      // 🔥 为每个商品创建订单
      for (const bagItem of items) {
        console.log("🔍 Creating order for item:", bagItem.item.id);
        
        const newOrder = await ordersService.createOrder({
          listing_id: parseInt(bagItem.item.id)
        });
        
        console.log("✅ Order created successfully:", newOrder);
      }
      
      // 🔥 显示成功消息并导航
      Alert.alert(
        "Order Placed Successfully!",
        `Your order has been confirmed. You will receive tracking details once it ships.`,
        [
          {
            text: "View Orders",
            onPress: () => {
              const rootNavigation = (navigation as any).getParent?.();
              if (rootNavigation) {
                rootNavigation.navigate("Main", {
                  screen: "MyTop",
                  params: {
                    screen: "PurchasesTab"
                  }
                });
              }
            }
          },
          { text: "Continue Shopping" }
        ]
      );
      
    } catch (error) {
      console.error("❌ Error creating order:", error);
      Alert.alert(
        "Error", 
        error instanceof Error ? error.message : "Failed to create order. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Header title="Checkout" showBack />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            <TouchableOpacity accessibilityRole="button" onPress={handleChangeAddress}>
              <Text style={styles.sectionAction}>Change</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.addressName}>{shippingAddress.name}</Text>
          <Text style={styles.addressPhone}>{shippingAddress.phone}</Text>
          <Text style={styles.addressBody}>{formatCurrentAddress()}</Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <TouchableOpacity accessibilityRole="button" onPress={handleChangePayment}>
              <Text style={styles.sectionAction}>Change</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.paymentRow}>
            <Icon name="card" size={20} color="#111" />
            <Text style={styles.paymentText}>
              {paymentMethod.brand} ending in {paymentMethod.last4}
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
          style={[styles.primaryButton, isCreatingOrder && styles.primaryButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={isCreatingOrder}
        >
          <Text style={styles.primaryText}>
            {isCreatingOrder ? "Creating Order..." : "Place order"}
          </Text>
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
  primaryButtonDisabled: {
    backgroundColor: "#bbb",
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});