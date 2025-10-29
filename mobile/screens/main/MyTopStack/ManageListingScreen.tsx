import React, { useState, useEffect } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type {
  CompositeNavigationProp,
  NavigatorScreenParams,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import type { MyTopStackParamList } from "./index";
import type { RootStackParamList } from "../../../App";
import type { PremiumStackParamList } from "../PremiumStack";
import { listingsService } from "../../../src/services/listingsService";
import type { ListingItem } from "../../../src/types/shop";

export default function ManageListingScreen() {
  const navigation = useNavigation<
    CompositeNavigationProp<
      NativeStackNavigationProp<MyTopStackParamList, "ManageListing">,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();
  const route = useRoute<RouteProp<MyTopStackParamList, "ManageListing">>();

  const [listing, setListing] = useState<ListingItem | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ 获取listing数据
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const listingId = route.params?.listingId;
        if (!listingId) {
          Alert.alert("Error", "No listing ID provided");
          navigation.goBack();
          return;
        }

        console.log("📖 Fetching listing for management:", listingId);
        const listingData = await listingsService.getListingById(listingId);
        
        if (listingData) {
          setListing(listingData);
          console.log("✅ Listing loaded for management:", listingData.title);
        } else {
          Alert.alert("Error", "Listing not found");
          navigation.goBack();
        }
      } catch (error) {
        console.error("❌ Error fetching listing:", error);
        Alert.alert("Error", "Failed to load listing");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [route.params?.listingId, navigation]);

  // ✅ 处理编辑listing
  const handleEditListing = () => {
    if (listing) {
      navigation.navigate("EditListing", { listingId: listing.id });
    }
  };

  // ✅ 处理标记为已售
  const handleMarkAsSold = () => {
    if (!listing) return;
    
    Alert.alert(
      "Mark as Sold",
      "Are you sure you want to mark this item as sold?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark as Sold",
          style: "destructive",
          onPress: async () => {
            try {
              await listingsService.updateListing(listing.id, { sold: true, listed: false });
              Alert.alert("Success", "Item marked as sold");
              navigation.goBack();
            } catch (error) {
              console.error("❌ Error marking as sold:", error);
              Alert.alert("Error", "Failed to mark as sold");
            }
          },
        },
      ]
    );
  };

  // ✅ 处理删除listing
  const handleDeleteListing = () => {
    if (!listing) return;
    
    Alert.alert(
      "Delete Listing",
      "Are you sure you want to delete this listing? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await listingsService.deleteListing(listing.id);
              Alert.alert("Success", "Listing deleted successfully");
              navigation.goBack();
            } catch (error) {
              console.error("❌ Error deleting listing:", error);
              Alert.alert("Error", "Failed to delete listing");
            }
          },
        },
      ]
    );
  };

  // ✅ 处理预览listing
  const handlePreviewListing = () => {
    if (listing) {
      navigation.navigate("ActiveListingDetail", { listingId: listing.id });
    }
  };

  const promotionPlansRoute: NavigatorScreenParams<PremiumStackParamList> = {
    screen: "PromotionPlans",
  };

  // 模拟数据（你确认过的数字）
  const performance = {
    bag: 1,
    likes: 2,
    views: 178,
    clicks: 32,
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <Header title="Listing" showBack />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <Header title="Listing" showBack />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Listing not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title="Listing" showBack />

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* 顶部卡片：缩略图 + 价格 + Preview 文案 */}
        <TouchableOpacity
          style={styles.topCard}
          activeOpacity={0.8}
          onPress={handlePreviewListing}
        >
          <Image 
            source={{ 
              uri: listing.images && listing.images.length > 0 
                ? listing.images[0] 
                : "https://via.placeholder.com/300x300/f4f4f4/999999?text=No+Image"
            }} 
            style={styles.thumb} 
          />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.topPrice}>${listing.price}</Text>
              <Icon name="create-outline" size={16} color="#6b6b6b" />
            </View>
            <Text style={styles.previewText}>Preview listing</Text>
          </View>
        </TouchableOpacity>

        {/* Promotion 卡片 */}
        <View style={styles.promoCard}>
          <View style={{ flexDirection: "row", alignItems: "center", columnGap: 8 }}>
            <Icon name="gift-outline" size={20} color="#111" />
            <Text style={styles.promoTitle}>
              Wanna make more people to see your listing?
            </Text>
          </View>
          <TouchableOpacity
            style={styles.promoLinkWrapper}
            onPress={() => navigation.navigate("Premium", promotionPlansRoute)}
          >
            <Text style={styles.promoLink}>Click To Get Promotion</Text>
          </TouchableOpacity>
        </View>

        {/* Performance */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCell}>
            <Icon name="bag-outline" size={22} color="#111" />
            <Text style={styles.metricNumber}>{performance.bag}</Text>
            <Text style={styles.metricLabel}>Bag</Text>
          </View>

          <View style={styles.metricCell}>
            <Icon name="heart-outline" size={22} color="#111" />
            <Text style={styles.metricNumber}>{performance.likes}</Text>
            <Text style={styles.metricLabel}>Likes</Text>
          </View>

          <View style={styles.metricCell}>
            <Icon name="eye-outline" size={22} color="#111" />
            <Text style={styles.metricNumber}>{performance.views}</Text>
            <Text style={styles.metricLabel}>Views</Text>
          </View>

          <View style={styles.metricCell}>
            <Icon name="sparkles-outline" size={22} color="#111" />
            <Text style={styles.metricNumber}>{performance.clicks}</Text>
            <Text style={styles.metricLabel}>Clicks</Text>
          </View>
        </View>

        {/* Manage your listing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manage your listing</Text>

          <TouchableOpacity
            style={styles.rowItem}
            onPress={handleEditListing}
          >
            <Text style={styles.rowText}>Edit Listing</Text>
            <Icon name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.rowItem} onPress={() => {}}>
            <Text style={styles.rowText}>Mark Your Item as Reserved</Text>
            <Icon name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.rowItem} onPress={handleMarkAsSold}>
            <Text style={styles.rowText}>Mark as Sold</Text>
            <Icon name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 底部删除 */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteListing}>
          <Text style={styles.deleteText}>Delete Listing</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  topCard: {
    marginTop: 8,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  thumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: "#eee" },
  topPrice: { fontSize: 18, fontWeight: "700", color: "#111", marginRight: 6 },
  previewText: { marginTop: 4, color: "#6b6b6b" },

  promoCard: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
    rowGap: 8,
  },
  promoLinkWrapper: { alignSelf: "flex-start", marginLeft: 28 },
  promoTitle: { fontSize: 14, fontWeight: "700", color: "#111", flex: 1, flexWrap: "wrap" },
  promoLink: { color: "#2563eb", fontWeight: "600", marginTop: 6 },

  metricsRow: {
    marginTop: 12,
    marginHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  metricNumber: { marginTop: 6, fontSize: 16, fontWeight: "700", color: "#111" },
  metricLabel: { marginTop: 2, color: "#777", fontSize: 12 },

  section: { marginTop: 18, marginHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },

  rowItem: {
    height: 48,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e6e6e6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowText: { fontSize: 15, color: "#111" },

  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e6e6e6",
    backgroundColor: "#fff",
  },
  deleteBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
