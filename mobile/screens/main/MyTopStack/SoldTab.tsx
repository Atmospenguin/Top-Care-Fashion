import React, { useState, useEffect, useMemo } from "react";
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
import { listingsService } from "../../../src/services";
import type { ListingItem } from "../../../types/shop";
import { SOLD_GRID_ITEMS } from "../../../mocks/shop";

// Ensure three-column grid alignment
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

type SoldFilter = "All" | "ToShip" | "InTransit" | "Completed" | "Cancelled";

export default function SoldTab() {
  const [filter, setFilter] = useState<SoldFilter>("All");
  const [modalVisible, setModalVisible] = useState(false);
  const [soldListings, setSoldListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterLabels: Record<string, string> = {
    All: "All",
    ToShip: "To Ship",
    InTransit: "In Transit",
    Completed: "Completed",
    Cancelled: "Cancelled",
  };

  const navigation =
    useNavigation<NativeStackNavigationProp<MyTopStackParamList>>();

  // Load sold listings from API
  const loadSoldListings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 🔥 获取所有sold状态的商品（包括被取消的）
  const { listings } = await listingsService.getUserListings({ status: 'sold' });
  setSoldListings(Array.isArray(listings) ? listings : []);
    } catch (err) {
      console.error("Error loading sold listings:", err);
      setError(err instanceof Error ? err.message : "Failed to load listings");
      
      // Fallback to empty array instead of mock data
      setSoldListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSoldListings();
  }, []);

  const normalizeOrderStatus = (status?: string | null) => {
    if (!status) return null;
    return status.toUpperCase();
  };

  const filterStatusMap: Record<Exclude<SoldFilter, "All">, string[]> = useMemo(() => ({
    ToShip: ["IN_PROGRESS", "TO_SHIP"],
    InTransit: ["SHIPPED", "IN_TRANSIT"],
    Completed: ["COMPLETED", "REVIEWED", "DELIVERED", "RECEIVED"],
    Cancelled: ["CANCELLED"],
  }), []);

  const getOverlayText = (status?: string | null) => {
    const normalized = normalizeOrderStatus(status);
    switch (normalized) {
      case "IN_PROGRESS":
      case "TO_SHIP":
        return "TO SHIP";
      case "SHIPPED":
      case "IN_TRANSIT":
        return "IN TRANSIT";
      case "DELIVERED":
        return "DELIVERED";
      case "RECEIVED":
        return "RECEIVED";
      case "COMPLETED":
        return "COMPLETED";
      case "REVIEWED":
        return "REVIEWED";
      case "CANCELLED":
        return "CANCELLED";
      default:
        return "SOLD";
    }
  };

  // Filter data based on order status
  const filtered = soldListings.filter((listing) => {
    const status = normalizeOrderStatus(listing.orderStatus);

    if (filter === "All") {
      // "All" 不包含被取消的订单，只显示有效的销售记录
      return status !== "CANCELLED";
    }

    if (!status) {
      return false;
    }

    const allowedStatuses = filterStatusMap[filter] ?? [];
    return allowedStatuses.includes(status);
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
              <Picker.Item label="To Ship" value="ToShip" />
              <Picker.Item label="In Transit" value="InTransit" />
              <Picker.Item label="Completed" value="Completed" />
              <Picker.Item label="Cancelled" value="Cancelled" />
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
              loadSoldListings();
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
            You haven't sold anything yet.{"\n"}List items to start selling!
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
                  // 🔥 导航到订单详情页面，根据订单状态显示不同的管理功能
                  const params = { 
                    id: item.orderId?.toString() || item.id, 
                    source: "sold" as const,
                    conversationId: item.conversationId || undefined
                  };
                  console.log("🔍 SoldTab navigating to OrderDetail with params:", params);
                  console.log("🔍 SoldTab conversationId:", item.conversationId);
                  navigation.navigate("OrderDetail", params);
                }}
              >
                <Image 
                  source={{ uri: item.images?.[0] || "https://via.placeholder.com/100x100" }} 
                  style={styles.image} 
                />
                {/* 🔥 数量徽章 */}
                {item.orderQuantity && item.orderQuantity > 1 && (
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityBadgeText}>×{item.orderQuantity}</Text>
                  </View>
                )}
                <View style={styles.overlay}>
                  <Text style={styles.overlayText}>
                    {getOverlayText(item.orderStatus)}
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },
  quantityBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#000",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 10,
  },
  quantityBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  overlayText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});

