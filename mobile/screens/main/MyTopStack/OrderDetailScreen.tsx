import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import Header from "../../../components/Header";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { MyTopStackParamList } from "./index";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ordersService, Order, OrderStatus } from "../../../src/services";
import {
  PURCHASE_ORDERS as purchaseOrders,
  SOLD_ORDERS as soldOrders,
  DEFAULT_SHIPPING_ADDRESS,
} from "../../../mocks/shop";

type Purchase = (typeof purchaseOrders)[number];
type Sold = (typeof soldOrders)[number];

// Helper function to map mock status to API status
function mapMockStatusToApiStatus(mockStatus: string): OrderStatus {
  switch (mockStatus) {
    case "InProgress": return "IN_PROGRESS";
    case "ToShip": return "TO_SHIP";
    case "Shipped": return "SHIPPED";
    case "Delivered": return "DELIVERED";
    case "Received": return "RECEIVED";
    case "Completed": return "COMPLETED";
    case "Reviewed": return "REVIEWED";
    case "Cancelled": return "CANCELLED";
    default: return "IN_PROGRESS";
  }
}

// Helper function to map API status to display status
function mapApiStatusToDisplayStatus(apiStatus: OrderStatus): string {
  switch (apiStatus) {
    case "IN_PROGRESS": return "InProgress";
    case "TO_SHIP": return "ToShip";
    case "SHIPPED": return "Shipped";
    case "DELIVERED": return "Delivered";
    case "RECEIVED": return "Received";
    case "COMPLETED": return "Completed";
    case "REVIEWED": return "Reviewed";
    case "CANCELLED": return "Cancelled";
    default: return "InProgress";
  }
}

export default function OrderDetailScreen() {
  const route = useRoute<RouteProp<MyTopStackParamList, "OrderDetail">>();
  const navigation = useNavigation<NativeStackNavigationProp<MyTopStackParamList>>();

  const params = (route.params as { id?: string; source?: "purchase" | "sold" } | undefined) ?? {};
  const id = params.id;
  const source = params.source ?? "purchase";

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load order data from API
  useEffect(() => {
    const loadOrder = async () => {
      if (!id) {
        setError("Order ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const orderId = parseInt(id);
        if (isNaN(orderId)) {
          throw new Error("Invalid order ID");
        }

        const orderData = await ordersService.getOrder(orderId);
        setOrder(orderData);
      } catch (err) {
        console.error("Error loading order:", err);
        setError(err instanceof Error ? err.message : "Failed to load order");
        
        // Fallback to mock data for development
        const foundOrder =
          source === "purchase"
            ? purchaseOrders.find((o) => String(o.id) === String(id))
            : soldOrders.find((o) => String(o.id) === String(id));
        
        if (foundOrder) {
          // Convert mock data to API format for compatibility
          const mockOrder: Order = {
            id: parseInt(foundOrder.id) || 1,
            buyer_id: source === "purchase" ? 1 : 2,
            seller_id: source === "purchase" ? 2 : 1,
            listing_id: 1,
            status: mapMockStatusToApiStatus(foundOrder.status),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            buyer: {
              id: source === "purchase" ? 1 : 2,
              username: source === "purchase" ? "You" : (foundOrder as Sold).buyer?.name || "Buyer",
              avatar_url: source === "purchase" ? undefined : (foundOrder as Sold).buyer?.avatar,
            },
            seller: {
              id: source === "purchase" ? 2 : 1,
              username: source === "purchase" ? (foundOrder as Purchase).seller?.name || "Seller" : "You",
              avatar_url: source === "purchase" ? (foundOrder as Purchase).seller?.avatar : undefined,
            },
            listing: {
              id: 1,
              name: foundOrder.product.title,
              description: foundOrder.product.description,
              price: foundOrder.product.price,
              image_url: foundOrder.product.images[0],
              image_urls: foundOrder.product.images,
              brand: foundOrder.product.brand,
              size: foundOrder.product.size,
              condition_type: foundOrder.product.condition,
            },
            reviews: [],
          };
          setOrder(mockOrder);
        }
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id, source]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={{ marginTop: 10 }}>Loading order...</Text>
      </View>
    );
  }

  if (error && !order) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: "red", textAlign: "center" }}>{error}</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text>Order not found</Text>
      </View>
    );
  }

  const isPurchase = source === "purchase";

  const handleCancel = async () => {
    if (!isPurchase || !order) return;
    
    try {
      const updatedOrder = await ordersService.cancelOrder(order.id);
      setOrder(updatedOrder);
      Alert.alert("Order Cancelled", "Your order has been successfully cancelled.");
    } catch (error) {
      console.error("Error cancelling order:", error);
      Alert.alert("Error", "Failed to cancel order. Please try again.");
    }
  };

  const handleReceived = async () => {
    if (!isPurchase || !order) return;
    
    try {
      const updatedOrder = await ordersService.markAsReceived(order.id);
      setOrder(updatedOrder);
      Alert.alert("Order marked as received", "You can now leave a review.");
    } catch (error) {
      console.error("Error marking order as received:", error);
      Alert.alert("Error", "Failed to mark order as received. Please try again.");
    }
  };

  // --- Seller side handlers ---
  const handleMarkShipped = async () => {
    if (isPurchase || !order) return;
    
    try {
      const updatedOrder = await ordersService.markAsShipped(order.id);
      setOrder(updatedOrder);
      Alert.alert("Order marked as shipped", "Your buyer will be notified.");
    } catch (error) {
      console.error("Error marking order as shipped:", error);
      Alert.alert("Error", "Failed to mark order as shipped. Please try again.");
    }
  };

  const handleCancelSold = async () => {
    if (isPurchase || !order) return;
    
    try {
      const updatedOrder = await ordersService.cancelOrder(order.id);
      setOrder(updatedOrder);
      Alert.alert("Order cancelled", "You have cancelled this order.");
    } catch (error) {
      console.error("Error cancelling order:", error);
      Alert.alert("Error", "Failed to cancel order. Please try again.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title={`Order #${order.id}`} showBack />

      <ScrollView contentContainerStyle={styles.container}>
        {/* 商品信息 */}
        <View style={styles.card}>
          <Image
            source={{ uri: order.listing?.image_url || order.listing?.image_urls?.[0] || "https://via.placeholder.com/100x120" }}
            style={styles.productImg}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {order.listing.name}
            </Text>
            <Text style={styles.productPrice}>${order.listing.price}</Text>
            <Text style={styles.productMeta}>Size: {order.listing.size}</Text>

            {/* 显示买家/卖家 */}
            {isPurchase ? (
              <View style={styles.userRow}>
                {order.seller.avatar_url && (
                  <Image source={{ uri: order.seller.avatar_url }} style={styles.userAvatar} />
                )}
                <Text style={styles.userName}>{order.seller.username}</Text>
              </View>
            ) : (
              <View style={styles.userRow}>
                {order.buyer.avatar_url && (
                  <Image source={{ uri: order.buyer.avatar_url }} style={styles.userAvatar} />
                )}
                <Text style={styles.userName}>{order.buyer.username}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 状态显示 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Status</Text>

          {order.status === "CANCELLED" ? (
            <Text style={styles.stepCancelled}>✗ Cancelled</Text>
          ) : (
            <View style={styles.progressRow}>
              <Text style={[styles.step, styles.stepDone]}>✓ Paid</Text>
              <Text
                style={[
                  styles.step,
                  ["SHIPPED", "DELIVERED", "RECEIVED", "COMPLETED", "REVIEWED"].includes(order.status)
                    ? styles.stepDone
                    : ["IN_PROGRESS", "TO_SHIP"].includes(order.status)
                    ? styles.stepPending
                    : styles.step,
                ]}
              >
                {["IN_PROGRESS", "TO_SHIP"].includes(order.status)
                  ? "… Pending"
                  : "✓ Shipped"}
              </Text>
              <Text
                style={[
                  styles.step,
                  ["DELIVERED", "RECEIVED", "COMPLETED", "REVIEWED"].includes(order.status)
                    ? styles.stepDone
                    : order.status === "SHIPPED"
                    ? styles.stepPending
                    : styles.step,
                ]}
              >
                {order.status === "SHIPPED" ? "… In Transit" : "✓ Delivered"}
              </Text>
              {["RECEIVED", "COMPLETED", "REVIEWED"].includes(order.status) && (
                <Text style={[styles.step, styles.stepDone]}>✓ Received</Text>
              )}
            </View>
          )}
        </View>

        {/* 收货地址 / Buyer Info */}
        {isPurchase ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            <Text style={styles.text}>Default Address</Text>
            <Text style={styles.text}>123 Main St, City, Country</Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Buyer Info</Text>
            <Text style={styles.text}>{order.buyer.username}</Text>
            {order.buyer.email && <Text style={styles.text}>{order.buyer.email}</Text>}
            {order.buyer.phone_number && <Text style={styles.text}>{order.buyer.phone_number}</Text>}

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
            <Text style={styles.text}>Date: {new Date(order.created_at).toLocaleDateString()}</Text>
            <Text style={styles.text}>Transaction ID: TXN-{order.id}</Text>
          </View>
        )}

        {/* 支付信息 */}
        {isPurchase && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <Text style={styles.text}>
              Paid ${order.listing.price} with PayPal
            </Text>
            <Text style={styles.text}>Date: {new Date(order.created_at).toLocaleDateString()}</Text>
            <Text style={styles.text}>
              Transaction ID: TXN-{order.id}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 🧭 底部操作按钮逻辑 */}
      {isPurchase && (
        <>
          {/* 🟠 IN_PROGRESS → Cancel */}
          {order.status === "IN_PROGRESS" && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.feedbackBtn, { backgroundColor: "#F54B3D" }]}
                onPress={handleCancel}
              >
                <Text style={styles.feedbackText}>Cancel Order</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 🟢 DELIVERED → RECEIVED */}
          {order.status === "DELIVERED" && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.feedbackBtn, { backgroundColor: "#000" }]}
                onPress={handleReceived}
              >
                <Text style={styles.feedbackText}>Order Received</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 🟣 RECEIVED / COMPLETED → Review */}
          {["RECEIVED", "COMPLETED"].includes(order.status) && (
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

      {/* 查看互评 - View Mutual Review for REVIEWED Orders */}
      {!isPurchase && order.status === "REVIEWED" && (
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

      {/* Leave Review - for completed orders without reviews yet */}
      {!isPurchase && order.status === "COMPLETED" && (
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

      {/* 卖家视图操作区 */}
      {!isPurchase && order.status === "TO_SHIP" && (
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