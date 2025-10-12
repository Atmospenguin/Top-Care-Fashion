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
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { MyTopStackParamList } from "./index";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  PURCHASE_ORDERS,
  SOLD_ORDERS,
  type PurchaseOrder,
  type SoldOrder,
} from "../../../mocks/shop";

export default function OrderDetailScreen() {
  const route = useRoute<RouteProp<MyTopStackParamList, "OrderDetail">>();
  // route.params may be undefined if navigation didn't pass params; guard it
  const navigation = useNavigation<NativeStackNavigationProp<MyTopStackParamList>>();
  const params = (route.params as { id?: string; source?: "purchase" | "sold" } | undefined) ?? undefined;
  const id = params?.id;
  const source = params?.source ?? "purchase";

  if (!id) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Order id missing</Text>
      </View>
    );
  }

  const order =
    source === "purchase"
      ? (PURCHASE_ORDERS.find((o) => o.id === id) as PurchaseOrder | undefined)
      : (SOLD_ORDERS.find((o) => o.id === id) as SoldOrder | undefined);

  if (!order) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Order not found</Text>
      </View>
    );
  }

  const isPurchase = source === "purchase";
  const status = order.status as
    | PurchaseOrder["status"]
    | SoldOrder["status"];
  const isCancelled = status === "Cancelled";
  const purchaseOrder = isPurchase ? (order as PurchaseOrder) : undefined;
  const soldOrder = !isPurchase ? (order as SoldOrder) : undefined;
  const shippedDone = isPurchase
    ? status === "Delivered"
    : status === "InTransit" || status === "Completed";
  const shippedPending = isPurchase
    ? status === "InProgress"
    : status === "ToShip";
  const deliveredDone = isPurchase
    ? status === "Delivered"
    : status === "Completed";
  const deliveredPending = !deliveredDone && !isCancelled && !isPurchase && status === "InTransit";
  const shippedLabel = shippedPending
    ? "Pending"
    : shippedDone
    ? "Shipped"
    : "Shipped";
  const deliveredLabel = deliveredDone
    ? "Delivered"
    : deliveredPending
    ? "In Transit"
    : "";
  const productImage = order.product?.images?.[0] ?? "";
  const productPrice = order.product ? `$${order.product.price.toFixed(2)}` : "";

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <Header title={`Order #${order.id}`} showBack />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Product info */}
        <View style={styles.card}>
          <Image source={{ uri: productImage }} style={styles.productImg} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {order.product?.title ?? ""}
            </Text>
            <Text style={styles.productPrice}>{productPrice}</Text>
            <Text style={styles.productMeta}>
              Size: {order.product?.size ?? ""}
            </Text>

            {/* Show seller/buyer */}
            {isPurchase && purchaseOrder?.seller ? (
              <View style={styles.userRow}>
                <Image
                  source={{ uri: purchaseOrder.seller.avatar }}
                  style={styles.userAvatar}
                />
                <Text style={styles.userName}>{purchaseOrder.seller.name}</Text>
              </View>
            ) : !isPurchase && soldOrder?.buyer ? (
              <View style={styles.userRow}>
                <Image
                  source={{ uri: soldOrder.buyer.avatar }}
                  style={styles.userAvatar}
                />
                <Text style={styles.userName}>{soldOrder.buyer.name}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Status timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Status</Text>

          {isCancelled ? (
            <Text style={styles.stepCancelled}>Cancelled</Text>
          ) : (
            <View style={styles.progressRow}>
              <Text style={[styles.step, styles.stepDone]}>Paid</Text>
              <Text
                style={[
                  styles.step,
                  shippedDone
                    ? styles.stepDone
                    : shippedPending
                    ? styles.stepPending
                    : styles.step,
                ]}
              >
                {shippedLabel}
              </Text>
              <Text
                style={[
                  styles.step,
                  deliveredDone
                    ? styles.stepDone
                    : deliveredPending
                    ? styles.stepPending
                    : styles.step,
                ]}
              >
                {deliveredLabel}
              </Text>
            </View>
          )}
        </View>


        {/* Shipping / buyer info */}
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
          </View>
        ) : null}

        {/* Payment details */}
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

      {/* Footer actions */}
  {isPurchase &&
  purchaseOrder &&
  !purchaseOrder.feedbackGiven &&
  purchaseOrder.status === "Delivered" && (
    <View style={styles.footer}>
      <TouchableOpacity
        style={styles.feedbackBtn}
        onPress={() => navigation.navigate("Feedback", { orderId: order.id })}
      >
        <Text style={styles.feedbackText}>Leave Feedback</Text>
      </TouchableOpacity>
    </View>
)}


      {!isPurchase && soldOrder?.status === "ToShip" && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.feedbackBtn, { backgroundColor: "black" }]}
          >
            <Text style={styles.feedbackText}>Mark as Shipped</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.feedbackBtn, { backgroundColor: "#F54B3D", marginTop: 8 }]}
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
