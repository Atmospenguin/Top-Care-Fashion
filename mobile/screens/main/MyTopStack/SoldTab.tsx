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

export default function SoldTab() {
  const [filter, setFilter] = useState<"All" | "ToShip" | "InTransit" | "Completed" | "Cancelled">("All");
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
      const listings = await listingsService.getUserListings({ status: 'sold' });
      setSoldListings(listings);
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

  // Filter data based on order status
  const filtered = soldListings.filter((listing) => {
    if (filter === "All") {
      // 🔥 "All" 不包含被取消的订单，只显示有效的销售记录
      return listing.orderStatus !== "CANCELLED";
    }
    
    // 🔥 完整的订单管理状态过滤
    if (filter === "ToShip") {
      return listing.orderStatus === "IN_PROGRESS"; // 🔥 卖家视角：IN_PROGRESS = To Ship
    }
    
    if (filter === "InTransit") {
      return listing.orderStatus === "SHIPPED";
    }
    
    if (filter === "Completed") {
      return listing.orderStatus === "COMPLETED" || listing.orderStatus === "REVIEWED";
    }
    
    if (filter === "Cancelled") {
      return listing.orderStatus === "CANCELLED";
    }
    
    return true;
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
              setLoading(true);
              // Trigger reload
              setSoldListings([]);
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
                <View style={styles.overlay}>
                  <Text style={styles.overlayText}>
                    {item.orderStatus === "CANCELLED" ? "CANCELLED" : "SOLD"}
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
  overlayText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});

