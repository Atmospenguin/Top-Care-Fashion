import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import { MOCK_LISTINGS } from "../../../mocks/shop";
import type { ListingItem } from "../../../types/shop";
import type { BuyStackParamList } from "./index";

type UserProfileParam = RouteProp<BuyStackParamList, "UserProfile">;
type BuyNavigation = NativeStackNavigationProp<BuyStackParamList>;

const likedGallery = [
  "https://tse1.mm.bing.net/th/id/OIP._PU2jbpd_bGX-M3WoLm6IAHaLe?rs=1&pid=ImgDetMain&o=7&rm=3",
  "https://tse3.mm.bing.net/th/id/OIP.mbv8-A49xgbIH4hkKjhCBwHaJc?rs=1&pid=ImgDetMain&o=7&rm=3",
  "https://y2kdream.com/cdn/shop/files/Y2K-Football-Crop-Top-6.webp?v=1723621579&width=750",
  "https://tse3.mm.bing.net/th/id/OIP.81YGmCDrRsgih3_rHL6qxgHaHa?rs=1&pid=ImgDetMain&o=7&rm=3",
  "https://tse3.mm.bing.net/th/id/OIP.VLA_zUUPCS-z2IemiQ43PgHaHa?rs=1&pid=ImgDetMain&o=7&rm=3",
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=640&q=80",
];

const mockReviews = [
  {
    id: "r-1",
    name: "Ava L.",
    avatar: "https://i.pravatar.cc/100?img=21",
    rating: 5,
    comment: "Loved the packaging and the dress was spotless. Would buy again!",
    time: "2 days ago",
  },
  {
    id: "r-2",
    name: "Mina K.",
    avatar: "https://i.pravatar.cc/100?img=32",
    rating: 4,
    comment: "Quick shipper and item matched the description.",
    time: "Last week",
  },
];

function formatData(data: any[], numColumns: number) {
  const result = [...data];
  const fullRows = Math.floor(result.length / numColumns);
  let itemsLastRow = result.length - fullRows * numColumns;

  while (itemsLastRow !== 0 && itemsLastRow !== numColumns) {
    result.push({ id: `blank-${itemsLastRow}`, empty: true });
    itemsLastRow++;
  }
  return result;
}

export default function UserProfileScreen() {
  const navigation = useNavigation<BuyNavigation>();
  const {
    params: { username, avatar, rating, sales },
  } = useRoute<UserProfileParam>();

  const [activeTab, setActiveTab] = useState<"Shop" | "Likes" | "Reviews">(
    "Shop"
  );

  const userListings = useMemo(
    () =>
      MOCK_LISTINGS.filter(
        (listing) => listing.seller.name.toLowerCase() === username.toLowerCase()
      ),
    [username]
  );

  const listingsData = useMemo(
    () => formatData(userListings, 3),
    [userListings]
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title={username} showBack />

      <View style={styles.profileSection}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <View style={{ rowGap: 6, flex: 1 }}>
          <Text style={styles.profileName}>{username}</Text>
          <Text style={styles.profileMeta}>
            {rating.toFixed(1)} rating · {sales} sales
          </Text>
        </View>
        <TouchableOpacity style={styles.messageBtn}>
          <Icon name="chatbubble-ellipses-outline" size={18} color="#000" />
          <Text style={styles.messageText}>Message</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {(["Shop", "Likes", "Reviews"] as const).map((tab) => (
          <View key={tab} style={{ alignItems: "center" }}>
            <TouchableOpacity onPress={() => setActiveTab(tab)}>
              <Text
                style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === "Shop" ? (
          userListings.length ? (
            <FlatList
              data={listingsData}
              keyExtractor={(item, index) =>
                String(item?.id ?? `spacer-${index}`)
              }
              numColumns={3}
              contentContainerStyle={styles.gridContent}
              renderItem={({ item }) =>
                item.empty ? (
                  <View style={[styles.gridItem, styles.gridItemInvisible]} />
                ) : (
                  <TouchableOpacity
                    style={styles.gridItem}
                    onPress={() =>
                      navigation.navigate("ListingDetail", { item: item as ListingItem })
                    }
                  >
                    <Image
                      source={{ uri: (item as ListingItem).images[0] }}
                      style={styles.gridImage}
                    />
                  </TouchableOpacity>
                )
              }
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No active listings yet</Text>
              <Text style={styles.emptySubtitle}>
                Follow {username} to stay notified when they add new items.
              </Text>
            </View>
          )
        ) : null}

        {activeTab === "Likes" ? (
          <FlatList
            data={formatData(
              likedGallery.map((uri, index) => ({ id: `like-${index}`, uri })),
              3
            )}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.gridContent}
            renderItem={({ item }) =>
              item.empty ? (
                <View style={[styles.gridItem, styles.gridItemInvisible]} />
              ) : (
                <View style={styles.gridItem}>
                  <Image source={{ uri: item.uri }} style={styles.gridImage} />
                  <View style={styles.likeBadge}>
                    <Icon name="heart" size={16} color="#f54b3d" />
                  </View>
                </View>
              )
            }
          />
        ) : null}

        {activeTab === "Reviews" ? (
          <FlatList
            data={mockReviews}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.reviewList}
            renderItem={({ item }) => (
              <View style={styles.reviewCard}>
                <Image source={{ uri: item.avatar }} style={styles.reviewAvatar} />
                <View style={{ flex: 1 }}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewName}>{item.name}</Text>
                    <View style={styles.reviewStars}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Icon
                          key={`${item.id}-star-${index}`}
                          name={index < item.rating ? "star" : "star-outline"}
                          size={13}
                          color="#f5a623"
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewTime}>{item.time}</Text>
                  <Text style={styles.reviewComment}>{item.comment}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No reviews yet</Text>
                <Text style={styles.emptySubtitle}>
                  Reviews appear here once this seller completes a few sales.
                </Text>
              </View>
            }
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
    columnGap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#eee",
  },
  profileName: { fontSize: 18, fontWeight: "700", color: "#111" },
  profileMeta: { fontSize: 14, color: "#666" },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#dcdcdc",
  },
  messageText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 16,
    color: "#777",
    paddingVertical: 6,
    fontWeight: "500",
  },
  tabLabelActive: {
    color: "#111",
    fontWeight: "700",
  },
  tabIndicator: {
    marginTop: 2,
    height: 3,
    width: 36,
    borderRadius: 999,
    backgroundColor: "#111",
  },
  gridContent: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 120,
  },
  gridItem: {
    flex: 1,
    margin: 4,
    aspectRatio: 1,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#f1f1f1",
  },
  gridItemInvisible: {
    backgroundColor: "transparent",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  likeBadge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    rowGap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  reviewList: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 120,
    rowGap: 16,
  },
  reviewCard: {
    flexDirection: "row",
    columnGap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  reviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#eee",
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewName: { fontSize: 15, fontWeight: "700", color: "#111" },
  reviewStars: { flexDirection: "row", columnGap: 2 },
  reviewTime: { fontSize: 12, color: "#7a7a7a", marginTop: 4 },
  reviewComment: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },
});
