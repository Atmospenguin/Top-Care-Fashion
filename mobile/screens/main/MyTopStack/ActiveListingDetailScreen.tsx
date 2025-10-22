import React, { useState, useEffect } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import type { MyTopStackParamList } from "./index";
import { listingsService } from "../../../src/services/listingsService";
import type { ListingItem } from "../../../src/types/shop";

const { width: WINDOW_WIDTH } = Dimensions.get("window");
const IMAGE_SIZE = Math.min(WINDOW_WIDTH - 48, 360);

export default function ActiveListingDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MyTopStackParamList>>();
  const route = useRoute<RouteProp<MyTopStackParamList, "ActiveListingDetail">>();

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

        console.log("📖 Fetching listing:", listingId);
        const listingData = await listingsService.getListingById(listingId);
        
        if (listingData) {
          setListing(listingData);
          console.log("✅ Listing loaded:", listingData.title);
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

  // ✅ 处理Manage Listing点击
  const handleManageListing = () => {
    if (listing) {
      navigation.navigate("ManageListing", { listingId: listing.id });
    }
  };

  // ✅ 处理Boost Listing点击
  const handleBoostListing = () => {
    if (listing) {
      navigation.navigate("PromotionPlans", { listingId: listing.id });
    }
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <Header title="" showBack />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.screen}>
        <Header title="" showBack />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Listing not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* 顶部返回 + 右上角彩板按钮（仅展示，与 buyer 版一致） */}
      <Header title="" showBack />

      <ScrollView contentContainerStyle={styles.container}>
        {/* 图片轮播 */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imageCarousel}
        >
          {(listing.images || []).map((uri, idx) => (
            <Image
              key={`${listing.id}-${idx}`}
              source={{ uri }}
              style={styles.image}
            />
          ))}
        </ScrollView>

        {/* 主信息卡片 */}
        <View style={styles.sectionCard}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{listing.title}</Text>
              <Text style={styles.price}>${listing.price.toFixed(2)}</Text>
            </View>
          </View>

          {/* size / condition */}
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaLabel}>Size</Text>
              <Text style={styles.metaValue}>{listing.size}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaLabel}>Condition</Text>
              <Text style={styles.metaValue}>{listing.condition}</Text>
            </View>
          </View>

          {/* 描述 */}
          <Text style={styles.description}>{listing.description}</Text>

          {/* brand / material */}
          <View style={styles.attributeRow}>
            <View style={styles.attributeBlock}>
              <Text style={styles.attributeLabel}>Brand</Text>
              <Text style={styles.attributeValue}>{listing.brand}</Text>
            </View>
            {listing.material ? (
              <View style={styles.attributeBlock}>
                <Text style={styles.attributeLabel}>Material</Text>
                <Text style={styles.attributeValue}>{listing.material}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Seller（我自己的资料，不显示 Message 按钮） */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Seller</Text>
          <View style={styles.sellerRow}>
            <Image 
              source={{ uri: listing.seller?.avatar || "" }} 
              style={styles.sellerAvatar} 
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.sellerName}>{listing.seller?.name || "Unknown"}</Text>
              <Text style={styles.sellerMeta}>
                {(listing.seller?.rating || 0).toFixed(1)} stars | {listing.seller?.sales || 0} sales
              </Text>
            </View>
            {/* 自己的 Listing，不展示 message */}
          </View>
        </View>

        {/* 物流与退货（与 buyer 版同款） */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Shipping & Returns</Text>
          <Text style={styles.description}>
            Ships within 2 business days from New York, USA. Trackable shipping is included.
            Returns accepted within 7 days of delivery.
          </Text>
        </View>
      </ScrollView>

      {/* 底部按钮：Manage / Boost（符合你的要求） */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleManageListing}
        >
          <Icon name="settings-outline" size={20} color="#111" />
          <Text style={styles.secondaryText}>Manage Listing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleBoostListing}
        >
          <Text style={styles.primaryText}>Boost Listing</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: { paddingBottom: 120, rowGap: 16 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  imageCarousel: { columnGap: 12, paddingHorizontal: 16 },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 16,
    backgroundColor: "#f2f2f2",
  },

  sectionCard: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
    rowGap: 12,
  },

  titleRow: { flexDirection: "row", alignItems: "center", columnGap: 12 },
  title: { fontSize: 20, fontWeight: "700" },
  price: { fontSize: 18, fontWeight: "700", color: "#111" },


  metaRow: { flexDirection: "row", columnGap: 12 },
  metaPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f6f6f6",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 12,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: { fontSize: 14, fontWeight: "600", color: "#111", marginTop: 4 },

  description: { fontSize: 14, color: "#333", lineHeight: 20 },

  attributeRow: { flexDirection: "row", columnGap: 16 },
  attributeBlock: { flex: 1 },
  attributeLabel: {
    fontSize: 12,
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  attributeValue: { fontSize: 15, fontWeight: "600", marginTop: 4 },

  sectionHeading: { fontSize: 16, fontWeight: "700" },

  sellerRow: { flexDirection: "row", alignItems: "center", columnGap: 12 },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e8e8e8",
  },
  sellerName: { fontSize: 15, fontWeight: "600" },
  sellerMeta: { fontSize: 13, color: "#666", marginTop: 2 },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 8,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#111",
    marginRight: 12,
  },
  secondaryText: { fontSize: 15, fontWeight: "700", color: "#111" },
  primaryButton: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  primaryText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
