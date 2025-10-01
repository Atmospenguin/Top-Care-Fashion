import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Header from "../../../components/Header";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { MyTopStackParamList } from "./index";

// mock 数据（分开买家/卖家）
const purchaseOrders: any[] = [
  {
    id: "1",
    product: {
      title: "Green Dress",
      price: 20,
      size: "S",
      image:
        "https://cdn.shopify.com/s/files/1/0281/2071/1254/products/191219hm74370_1800x1800.jpg?v=1607871412",
    },
    seller: {
      name: "sellerA",
      avatar: "https://i.pravatar.cc/100?img=11",
    },
    status: "InProgress",
    address: {
      name: "Cindy Chen",
      phone: "+65 9123 4567",
      detail: "Singapore, Parc Riviera",
    },
    payment: {
      method: "PayPal",
      amount: 20,
      date: "2025-09-20 18:32",
      transactionId: "TXN0001",
    },
    feedbackGiven: false,
  },
  {
    id: "2",
    product: {
      title: "American Eagle Super Stretch Skinny Jeans",
      price: 10,
      size: "6",
      image:
        "https://tse4.mm.bing.net/th/id/OIP.TC_mOkLd6sQzsLiE_uSloQHaJ3?w=600&h=799&rs=1&pid=ImgDetMain&o=7&rm=3",
    },
    seller: {
      name: "seller111",
      avatar: "https://i.pravatar.cc/100?img=12",
    },
    status: "Delivered",
    address: {
      name: "Cindy Chen",
      phone: "+65 9123 4567",
      detail: "101 W Coast Vale, Block101 17-05, Parc Riviera, Singapore",
    },
    payment: {
      method: "PayPal",
      amount: 14.5,
      date: "2025-09-20 18:32",
      transactionId: "TXN123456789",
    },
    feedbackGiven: false,
  },
];

const soldOrders: any[] = [
  {
    id: "1",
    product: {
      title: "Red Jacket",
      price: 30,
      size: "M",
      image:
        "https://th.bing.com/th/id/R.d54043fa984e94c86b926d96ed3eb6a1?rik=l0s2kAsoEoM6Og&pid=ImgRaw&r=0",
    },
    buyer: { name: "buyer001", avatar: "https://i.pravatar.cc/100?img=31" },
    status: "To Ship",
    feedbackGiven: false,
  },
  {
    id: "2",
    product: {
      title: "Casual Hoodie",
      price: 25,
      size: "L",
      image:
        "https://i5.walmartimages.com/asr/7aed82da-69af-46b8-854e-5c22d45a4df3.e7011d0ebdea1d9fabb68417c789ae16.jpeg",
    },
    buyer: { name: "buyer002", avatar: "https://i.pravatar.cc/100?img=32" },
    status: "Completed",
    feedbackGiven: false,
  },
];

export default function OrderDetailScreen() {
  const route = useRoute<RouteProp<MyTopStackParamList, "OrderDetail">>();
  const { id, source } = route.params as { id: string; source: "purchase" | "sold" };

  const order =
    source === "purchase"
      ? purchaseOrders.find((o: any) => o.id === id)
      : soldOrders.find((o: any) => o.id === id);

  if (!order) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Order not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <Header title={`Order #${order.id}`} showBack />

      <ScrollView contentContainerStyle={styles.container}>
        {/* 商品信息 */}
        <View style={styles.card}>
          <Image source={{ uri: order.product.image }} style={styles.productImg} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {order.product.title}
            </Text>
            <Text style={styles.productPrice}>${order.product.price}</Text>
            <Text style={styles.productMeta}>Size: {order.product.size}</Text>
            {source === "purchase" && order.seller ? (
              <View style={styles.sellerRow}>
                <Image source={{ uri: order.seller.avatar }} style={styles.sellerAvatar} />
                <Text style={styles.sellerName}>{order.seller.name}</Text>
              </View>
            ) : source === "sold" && order.buyer ? (
              <View style={styles.sellerRow}>
                <Image source={{ uri: order.buyer.avatar }} style={styles.sellerAvatar} />
                <Text style={styles.sellerName}>{order.buyer.name}</Text>
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
                  order.status !== "InProgress" ? styles.stepDone : styles.stepPending,
                ]}
              >
                {order.status !== "InProgress" ? "✓ Shipped" : "… Pending"}
              </Text>
              <Text
                style={[
                  styles.step,
                  order.status === "Delivered" ? styles.stepDone : styles.stepPending,
                ]}
              >
                {order.status === "Delivered" ? "✓ Delivered" : "… In Transit"}
              </Text>
            </View>
          )}
        </View>

        {/* 收货地址 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {source === "purchase" ? "Shipping Address" : "Buyer Info"}
          </Text>
          <Text style={styles.text}>{order.address.name}</Text>
          <Text style={styles.text}>{order.address.phone}</Text>
          <Text style={styles.text}>{order.address.detail}</Text>
        </View>

        {/* 支付信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <Text style={styles.text}>
            Paid ${order.payment.amount} with {order.payment.method}
          </Text>
          <Text style={styles.text}>Date: {order.payment.date}</Text>
          <Text style={styles.text}>
            Transaction ID: {order.payment.transactionId}
          </Text>
        </View>
      </ScrollView>

      {/* 底部操作按钮 */}
      {source === "purchase" && !order.feedbackGiven && order.status === "Delivered" && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.feedbackBtn}>
            <Text style={styles.feedbackText}>Leave Feedback</Text>
          </TouchableOpacity>
        </View>
      )}

      {source === "sold" && order.status === "InProgress" && (
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.feedbackBtn, { backgroundColor: "green" }]}> 
            <Text style={styles.feedbackText}>Mark as Shipped</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.feedbackBtn, { backgroundColor: "red", marginTop: 8 }]}
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
  sellerRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  sellerAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: 6 },
  sellerName: { fontSize: 14, color: "#333" },
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
