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
    RECEIVED: "Received",
    CANCELLED: "Cancelled",
    REVIEWED: "Reviewed",
  };

  // Load purchased orders from API
  useEffect(() => {
    const loadPurchasedOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await ordersService.getBoughtOrders();
        setOrders(response.orders);
      } catch (err) {
        console.error("Error loading purchased orders:", err);
        setError(err instanceof Error ? err.message : "Failed to load orders");
        
        // Fallback to mock data
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

  // Filter data
  const filtered = orders.filter((order) => {
    if (filter === "All") return true;

    // ✅ 新增逻辑：RECEIVED 也归到 COMPLETED 分类中
    if (filter === "COMPLETED" && ["COMPLETED", "RECEIVED"].includes(order.status)) {
      return true;
    }

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
              <Picker.Item label="Received" value="RECEIVED" />
              <Picker.Item label="Cancelled" value="CANCELLED" />
              <Picker.Item label="Reviewed" value="REVIEWED" />
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
                  // 🔍 Debug: confirm navigating with correct id
                  try {
                    console.log("Navigating to order id:", item.id);
                  } catch (e) {
                    // no-op
                  }
                  navigation.navigate("OrderDetail", {
                    id: item.id.toString(),
                    source: "purchase",
                  });
                }}
              >
                <Image 
                  source={{ uri: item.listing.image_url || item.listing.image_urls?.[0] || "https://via.placeholder.com/100x100" }} 
                  style={styles.image} 
                />
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
});
