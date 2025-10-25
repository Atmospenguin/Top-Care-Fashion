import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MyTopStackParamList } from "./index";
import { ordersService, Order, OrderStatus } from "../../../src/services";
import { PURCHASE_GRID_ITEMS } from "../../../mocks/shop";

function formatData(data: any[], numColumns: number) {
  const newData = [...data];
  const numberOfFullRows = Math.floor(newData.length / numColumns);
  let numberOfElementsLastRow = newData.length - numberOfFullRows * numColumns;
  while (
    numberOfElementsLastRow !== numColumns &&
    numberOfElementsLastRow !== 0
  ) {
    newData.push({ id: `blank-${numberOfElementsLastRow}`, empty: true });
    numberOfElementsLastRow++;
  }
  return newData;
}

export default function PurchasesTab() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MyTopStackParamList>>();

  const [filter, setFilter] = useState<OrderStatus | "All">("All");
  const [modalVisible, setModalVisible] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterLabels: Record<string, string> = {
    All: "All",
    IN_PROGRESS: "In Progress",
    DELIVERED: "Delivered", 
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };

  // Load purchased orders from API
  useEffect(() => {
    const loadPurchasedOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("🔍 PurchasesTab - Loading purchased orders...");
        const response = await ordersService.getBoughtOrders();
        console.log("🔍 PurchasesTab - API response:", response);
        console.log("🔍 PurchasesTab - Orders count:", response.orders?.length || 0);
        
        setOrders(response.orders);
      } catch (err) {
        console.error("❌ PurchasesTab - Error loading purchased orders:", err);
        setError(err instanceof Error ? err.message : "Failed to load orders");
        
        // Fallback to mock data
        console.log("🔍 PurchasesTab - Using mock data as fallback");
        const mockOrders: Order[] = PURCHASE_GRID_ITEMS.map((item, index) => ({
          id: parseInt(item.id) || index + 1,
          buyer_id: 1,
          seller_id: 2,
          listing_id: index + 1,
          status: mapMockStatusToApiStatus(item.status),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          buyer: {
            id: 1,
            username: "You",
            avatar_url: undefined,
          },
          seller: {
            id: 2,
            username: "Seller",
            avatar_url: undefined,
          },
          listing: {
            id: index + 1,
            name: `Product ${index + 1}`,
            description: "",
            price: 0,
            image_url: item.image,
            image_urls: [item.image],
            brand: "",
            size: "",
            condition_type: "GOOD",
          },
          reviews: [],
        }));
        setOrders(mockOrders);
      } finally {
        setLoading(false);
      }
    };

    loadPurchasedOrders();
  }, []);

  // Helper function to map mock status to API status
  function mapMockStatusToApiStatus(mockStatus: string): OrderStatus {
    switch (mockStatus) {
      case "InProgress": return "IN_PROGRESS";
      case "Delivered": return "DELIVERED";
      case "Completed": return "COMPLETED";
      case "Received": return "RECEIVED";
      case "Cancelled": return "CANCELLED";
      case "Reviewed": return "REVIEWED";
      default: return "IN_PROGRESS";
    }
  }

  // Helper function to get display text for status
  function getStatusDisplayText(status: OrderStatus): string {
    switch (status) {
      case "IN_PROGRESS": return "In Progress";
      case "TO_SHIP": return "To Ship";
      case "SHIPPED": return "Shipped";
      case "DELIVERED": return "Delivered";
      case "RECEIVED": return "Received";
      case "COMPLETED": return "Completed";
      case "CANCELLED": return "Cancelled";
      case "REVIEWED": return "Reviewed";
      default: return "Unknown";
    }
  }

  // Handle cancel order
  const handleCancel = async (orderId: number) => {
    try {
      console.log("🔍 PurchasesTab - Cancelling order:", orderId);
      const updatedOrder = await ordersService.cancelOrder(orderId);
      
      // 🔥 发送系统消息到 ChatScreen - 根据用户角色发送不同视角的消息
      const order = orders.find(o => o.id === orderId);
      if (order?.conversations?.[0]?.id) {
        try {
          const { messagesService } = await import("../../../src/services");
          // 买家取消订单：发送操作者视角的消息，ChatScreen 会根据用户角色显示不同内容
          await messagesService.sendMessage(order.conversations[0].id.toString(), {
            content: "I've cancelled this order.", // 买家视角：我取消了订单
            message_type: "SYSTEM"
          });
          console.log("✅ System message sent: I've cancelled this order.");
        } catch (messageError) {
          console.error("❌ Failed to send system message:", messageError);
        }
      }
      
      // Update the orders list
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? updatedOrder : order
        )
      );
      
      Alert.alert("Order Cancelled", "Your order has been successfully cancelled.");
    } catch (error) {
      console.error("❌ PurchasesTab - Error cancelling order:", error);
      Alert.alert("Error", "Failed to cancel order. Please try again.");
    }
  };

  // Filter data
  const filtered = orders.filter((order) => {
    if (filter === "All") return order.status !== "CANCELLED"; // 🔥 "All" 不包含 cancelled orders
    return order.status === filter;
  });

  return (
    <View style={{ flex: 1 }}>
      {/* Filter button */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ fontSize: 16, fontWeight: '500' }}>{filterLabels[filter] ?? filter} ▼</Text>
        </TouchableOpacity>
      </View>

      {/* Filter modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Picker
              selectedValue={filter}
              onValueChange={(val) => {
                setFilter(val);
                setModalVisible(false);
              }}
            >
              <Picker.Item label="All" value="All" />
              <Picker.Item label="In Progress" value="IN_PROGRESS" />
              <Picker.Item label="Delivered" value="DELIVERED" />
              <Picker.Item label="Completed" value="COMPLETED" />
              <Picker.Item label="Cancelled" value="CANCELLED" />
            </Picker>
          </View>
        </View>
      </Modal>

      {/* Loading state */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={{ marginTop: 10 }}>Loading orders...</Text>
        </View>
      )}

      {/* Error state */}
      {error && !loading && (
        <View style={styles.centered}>
          <Text style={{ color: "red", textAlign: "center", marginBottom: 10 }}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setError(null);
              setLoading(true);
              // Trigger reload
              setOrders([]);
            }}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            You haven't purchased anything yet.{"\n"}Browse items to start shopping!
          </Text>
        </View>
      )}

      {/* Item grid */}
      {!loading && !error && filtered.length > 0 && (
        <FlatList
          data={formatData(filtered, 3)}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          renderItem={({ item }) =>
            item.empty ? (
              <View style={[styles.item, styles.itemInvisible]} />
            ) : (
              <TouchableOpacity
                style={styles.item}
                onPress={() => {
                  if (!item.id) return;
                  console.log("🔍 PurchasesTab - Navigating to order id:", item.id);
                  console.log("🔍 PurchasesTab - Item object:", item);
                  console.log("🔍 PurchasesTab - Item conversations:", item.conversations);
                  console.log("🔍 PurchasesTab - Item conversationId:", item.conversationId);
                  
                  navigation.navigate("OrderDetail", {
                    id: item.id.toString(),
                    source: "purchase",
                    conversationId: item.conversationId || item.conversations?.[0]?.id?.toString() || undefined,
                  });
                }}
              >
                <Image 
                  source={{ 
                    uri: item.listing?.image_url || 
                         (typeof item.listing?.image_urls === 'string' ? JSON.parse(item.listing.image_urls)[0] : item.listing?.image_urls?.[0]) || 
                         "https://via.placeholder.com/100x100" 
                  }} 
                  style={styles.image} 
                />
                {/* Status overlay */}
                <View style={styles.overlay}>
                  <Text style={styles.overlayText}>
                    {item.status === "CANCELLED" ? "CANCELLED" : 
                     item.status === "IN_PROGRESS" ? "PENDING" :
                     item.status === "DELIVERED" ? "DELIVERED" :
                     item.status === "COMPLETED" ? "COMPLETED" : 
                     item.status}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterBtn: {
    fontSize: 16,
    fontWeight: "500",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalBox: {
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  retryBtn: {
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyBox: {
    marginTop: 10,
    marginHorizontal: 16,
    backgroundColor: "#E6F0FF",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  emptyText: { 
    textAlign: "center", 
    color: "#555",
    fontSize: 16,
    lineHeight: 22,
  },
  item: {
    flex: 1,
    margin: 2,
    aspectRatio: 1,
    position: "relative",
  },
  itemInvisible: {
    backgroundColor: "transparent",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
  },
  // Status overlay (mimicking SoldTab)
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },
  overlayText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});
