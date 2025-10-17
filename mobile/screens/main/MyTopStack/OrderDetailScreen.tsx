import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import Header from "../../../components/Header";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { MyTopStackParamList } from "./index";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  PURCHASE_ORDERS as purchaseOrders,
  SOLD_ORDERS as soldOrders,
  DEFAULT_SHIPPING_ADDRESS,
} from "../../../mocks/shop";

type Purchase = (typeof purchaseOrders)[number];
type Sold = (typeof soldOrders)[number];

export default function OrderDetailScreen() {
  const route = useRoute<RouteProp<MyTopStackParamList, "OrderDetail">>();
  const navigation = useNavigation<NativeStackNavigationProp<MyTopStackParamList>>();

  const params = (route.params as { id?: string; source?: "purchase" | "sold" } | undefined) ?? {};
  const id = params.id;
  const source = params.source ?? "purchase";

  // 🔍 Debug logs to verify runtime data and navigation params
  try {
    console.log(
      "✅ purchaseOrders in runtime:",
      purchaseOrders.map((o) => String(o.id))
    );
  } catch (e) {
    // no-op
  }
  console.log("🟢 route params:", id, source);

  // ✅ 确保能匹配字符串与数字
  const foundOrder =
    source === "purchase"
      ? purchaseOrders.find((o) => String(o.id) === String(id))
      : soldOrders.find((o) => String(o.id) === String(id));

  const [order, setOrder] = useState<Purchase | Sold | null>(foundOrder ?? null);

 
  console.log("🟣 current status:", (order as any)?.status);

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text>Order not found</Text>
      </View>
    );
  }

  const isPurchase = source === "purchase";

  const handleCancel = () => {
    if (!isPurchase) return;
    setOrder((prev) => {
      if (!prev) return prev;
      const current = prev as Purchase;
      return { ...current, status: "Cancelled" };
    });
    Alert.alert("Order Cancelled", "Your order has been successfully cancelled.");
  };

  const handleReceived = () => {
    if (!isPurchase) return;
    setOrder((prev) => {
      if (!prev) return prev;
      const current = prev as Purchase;
      return { ...current, status: "Received" };
    });
    Alert.alert("Order marked as received", "You can now leave a review.");
  };

  // --- Seller side handlers ---
  const handleMarkShipped = () => {
    if (isPurchase) return;
    setOrder((prev) => {
      if (!prev) return prev;
      const current = prev as Sold;
      return { ...current, status: "Shipped" as any };
    });
    Alert.alert("Order marked as shipped", "Your buyer will be notified.");
  };

  const handleCancelSold = () => {
    if (isPurchase) return;
    setOrder((prev) => {
      if (!prev) return prev;
      const current = prev as Sold;
      return { ...current, status: "Cancelled" };
    });
    Alert.alert("Order cancelled", "You have cancelled this order.");
  };

  const purchaseOrder = isPurchase ? (order as Purchase) : null;
  const soldOrder = !isPurchase ? (order as Sold) : null;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title={`Order #${order.id}`} showBack />

      <ScrollView contentContainerStyle={styles.container}>
        {/* 商品信息 */}
        <View style={styles.card}>
          <Image
            source={{ uri: order.product.images[0] }}
            style={styles.productImg}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {order.product.title}
            </Text>
            <Text style={styles.productPrice}>${order.product.price}</Text>
            <Text style={styles.productMeta}>Size: {order.product.size}</Text>

            {/* 显示买家/卖家 */}
            {isPurchase && purchaseOrder?.seller ? (
              <View style={styles.userRow}>
                <Image source={{ uri: purchaseOrder.seller.avatar }} style={styles.userAvatar} />
                <Text style={styles.userName}>{purchaseOrder.seller.name}</Text>
              </View>
            ) : !isPurchase && soldOrder?.buyer ? (
              <View style={styles.userRow}>
                <Image source={{ uri: soldOrder.buyer.avatar }} style={styles.userAvatar} />
                <Text style={styles.userName}>{soldOrder.buyer.name}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* 状态显示 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Status</Text>

          {order.status === "Cancelled" ? (
            <Text style={styles.stepCancelled}>✗ Cancelled</Text>
          ) : (
            <View style={styles.progressRow}>
              <Text style={[styles.step, styles.stepDone]}>✓ Paid</Text>
              <Text
                style={[
                  styles.step,
                  ["Shipped", "Delivered", "Received", "Completed"].includes(order.status)
                    ? styles.stepDone
                    : ["InProgress", "ToShip"].includes(order.status)
                    ? styles.stepPending
                    : styles.step,
                ]}
              >
                {["InProgress", "ToShip"].includes(order.status)
                  ? "… Pending"
                  : "✓ Shipped"}
              </Text>
              <Text
                style={[
                  styles.step,
                  ["Delivered", "Received", "Completed"].includes(order.status)
                    ? styles.stepDone
                    : order.status === "Shipped"
                    ? styles.stepPending
                    : styles.step,
                ]}
              >
                {order.status === "Shipped" ? "… In Transit" : "✓ Delivered"}
              </Text>
              {["Received", "Completed"].includes(order.status) && (
                <Text style={[styles.step, styles.stepDone]}>✓ Received</Text>
              )}
            </View>
          )}
        </View>

        {/* 收货地址 / Buyer Info */}
        {isPurchase && purchaseOrder?.address ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            <Text style={styles.text}>{purchaseOrder.address.name}</Text>
            <Text style={styles.text}>{purchaseOrder.address.phone}</Text>
            <Text style={styles.text}>{purchaseOrder.address.detail}</Text>
          </View>
        ) : !isPurchase && soldOrder?.buyer ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Buyer Info</Text>
            <Text style={styles.text}>{soldOrder.buyer.name}</Text>

            {/* Seller-side: Show shipping address (mocked from default) */}
            <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Shipping Address</Text>
            <Text style={styles.text}>{DEFAULT_SHIPPING_ADDRESS.name}</Text>
            <Text style={styles.text}>{DEFAULT_SHIPPING_ADDRESS.phone}</Text>
            <Text style={styles.text}>
              {DEFAULT_SHIPPING_ADDRESS.line1}, {DEFAULT_SHIPPING_ADDRESS.city}, {DEFAULT_SHIPPING_ADDRESS.country}
            </Text>

            {/* Seller-side: Payment Info (mock/demo) */}
            <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Payment Info</Text>
            <Text style={styles.text}>Method: PayPal</Text>
            <Text style={styles.text}>Date: 2025-09-20 18:32</Text>
            <Text style={styles.text}>Transaction ID: TXN-DEMO-SELLER</Text>
          </View>
        ) : null}

        {/* 支付信息 */}
        {isPurchase && purchaseOrder?.payment ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <Text style={styles.text}>
              Paid ${purchaseOrder.payment.amount} with {purchaseOrder.payment.method}
            </Text>
            <Text style={styles.text}>Date: {purchaseOrder.payment.date}</Text>
            <Text style={styles.text}>
              Transaction ID: {purchaseOrder.payment.transactionId}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* 🧭 底部操作按钮逻辑 */}
      {isPurchase && !order.feedbackGiven && (
        <>
          {/* 🟠 InProgress → Cancel */}
          {order.status === "InProgress" && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.feedbackBtn, { backgroundColor: "#F54B3D" }]}
                onPress={handleCancel}
              >
                <Text style={styles.feedbackText}>Cancel Order</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 🟢 Delivered → Received */}
          {order.status === "Delivered" && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.feedbackBtn, { backgroundColor: "#000" }]}
                onPress={handleReceived}
              >
                <Text style={styles.feedbackText}>Order Received</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 🟣 Received / Completed → Review */}
          {["Received", "Completed"].includes(order.status) && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.feedbackBtn}
                onPress={() =>
                  (navigation as any).navigate("Review", { orderId: order.id })
                }
              >
                <Text style={styles.feedbackText}>Leave Review</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* 查看互评 - View Mutual Review for Completed Orders */}
      {isPurchase && order.status === "Completed" && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.feedbackBtn, { backgroundColor: "#2d7ef0" }]}
            onPress={() =>
              (navigation as any).navigate("MutualReview", { orderId: order.id })
            }
          >
            <Text style={styles.feedbackText}>View Mutual Review</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 卖家视图 - Seller side: View Mutual Review */}
      {!isPurchase && order.status === "Completed" && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.feedbackBtn, { backgroundColor: "#2d7ef0" }]}
            onPress={() =>
              (navigation as any).navigate("MutualReview", { orderId: order.id })
            }
          >
            <Text style={styles.feedbackText}>View Mutual Review</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 卖家视图操作区 */}
      {!isPurchase && order.status === "ToShip" && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.feedbackBtn, { backgroundColor: "black" }]}
            onPress={handleMarkShipped}
          >
            <Text style={styles.feedbackText}>Mark as Shipped</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.feedbackBtn, { backgroundColor: "#F54B3D", marginTop: 8 }]}
            onPress={handleCancelSold}
          >
            <Text style={styles.feedbackText}>Cancel Order</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 100 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  productImg: { width: 100, height: 120, borderRadius: 8 },
  productTitle: { fontSize: 16, fontWeight: "600" },
  productPrice: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  productMeta: { fontSize: 14, color: "#666", marginTop: 4 },
  userRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  userAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: 6 },
  userName: { fontSize: 14, color: "#333" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 6 },
  text: { fontSize: 14, color: "#333", marginBottom: 2 },
  progressRow: { flexDirection: "row", justifyContent: "space-between" },
  step: { fontSize: 14 },
  stepDone: { color: "green", fontWeight: "600" },
  stepPending: { color: "orange", fontWeight: "600" },
  stepCancelled: { fontSize: 14, color: "red", fontWeight: "700" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  feedbackBtn: {
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  feedbackText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
