import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DEFAULT_AVATAR } from "../../../constants/assetUrls";
import Icon from "../../../components/Icon";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { MyTopStackParamList } from "./index";
import SoldTab from "./SoldTab";
import PurchasesTab from "./PurchasesTab";
import LikesTab from "./LikesTab";
// --- 保证 3 列对齐 ---
function formatData(data: any[], numColumns: number) {
  const newData = [...data];
  const numberOfFullRows = Math.floor(newData.length / numColumns);
  let numberOfElementsLastRow = newData.length - numberOfFullRows * numColumns;

  while (numberOfElementsLastRow !== 0 && numberOfElementsLastRow !== numColumns) {
    newData.push({ id: `blank-${numberOfElementsLastRow}`, empty: true });
    numberOfElementsLastRow++;
  }

  return newData;
}

export default function MyTopScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MyTopStackParamList>>();
  const route = useRoute<RouteProp<MyTopStackParamList, "MyTopMain">>();
  const [activeTab, setActiveTab] =
    useState<"Shop" | "Sold" | "Purchases" | "Likes">("Shop");

  useFocusEffect(
    useCallback(() => {
      if (route.params?.initialTab) {
        setActiveTab(route.params.initialTab);
        navigation.setParams({ initialTab: undefined });
      }
    }, [route.params?.initialTab, navigation])
  );

  const mockUser = {
    username: "ccc446981",
    followers: 0,
    following: 0,
    reviews: 0,
    bio: "My name is Pink, and I'm really glad to meet you",
    avatar: DEFAULT_AVATAR,
    activeListings: [
      {
        id: 1,
        image:
          "https://th.bing.com/th/id/OIP.S07mGFGvwi2ldQARRcy0ngHaJ4?w=138&h=190&c=7&r=0&o=7&cb=12&dpr=2&pid=1.7&rm=3",
      },
    ],
  };

  const tabs: Array<"Shop" | "Sold" | "Purchases" | "Likes"> = [
    "Shop",
    "Sold",
    "Purchases",
    "Likes",
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      {/* 顶部 Header */}
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.username}>{mockUser.username}</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
          <Icon name="settings-sharp" size={24} color="#111" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <View key={tab} style={{ alignItems: "center" }}>
            <TouchableOpacity onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tab, activeTab === tab && styles.activeTab]}>
                {tab}
              </Text>
            </TouchableOpacity>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </View>
        ))}
      </View>

      {/* 内容区 */}
      <View style={{ flex: 1 }}>
        {activeTab === "Shop" && (
          <FlatList
            data={
              mockUser.activeListings.length
                ? formatData(mockUser.activeListings, 3)
                : []
            }
            keyExtractor={(item) => String(item.id)}
            numColumns={3}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.headerContent}>
                {/* Profile 区 */}
                <View style={styles.profileRow}>
                  <Image source={mockUser.avatar} style={styles.avatar} />
                  <View style={styles.statsRow}>
                    <Text style={styles.stats}>{mockUser.followers} followers</Text>
                    <Text style={styles.stats}>{mockUser.following} following</Text>
                    <Text style={styles.stats}>{mockUser.reviews} reviews</Text>
                  </View>
                </View>

                {/* Bio */}
                <View style={styles.bioRow}>
                  <Text style={styles.bio}>{mockUser.bio}</Text>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate("EditProfile")}
                  >
                    <Text style={styles.editBtnText}>Edit Profile</Text>
                  </TouchableOpacity>
                </View>

                {/* Active Title */}
                <View style={styles.activeRow}>
                  <Text style={styles.activeTitle}>
                    Active ({mockUser.activeListings.length} listings)
                  </Text>
                  <TouchableOpacity>
                    <Icon name="filter" size={24} color="#111" />
                  </TouchableOpacity>
                </View>
              </View>
            }
            ListHeaderComponentStyle={{ paddingHorizontal: 0 }} // ✅ 防止默认 padding
            contentContainerStyle={{
              paddingBottom: 60,
            }}
            renderItem={({ item }) =>
              item.empty ? (
                <View style={[styles.itemBox, styles.itemInvisible]} />
              ) : (
                <TouchableOpacity
                  style={styles.itemBox}
                  onPress={() => navigation.navigate("ActiveListingDetail")}
                >
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                </TouchableOpacity>
              )
            }
            ListEmptyComponent={
              <View style={[styles.emptyBox]}>
                <Text style={styles.emptyText}>
                  You haven't listed anything for sale yet.{"\n"}Tap + below to get started.
                </Text>
              </View>
            }
          />
        )}

        {activeTab === "Sold" && <SoldTab />}
        {activeTab === "Purchases" && <PurchasesTab />}
        {activeTab === "Likes" && <LikesTab />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 48,
  },
  username: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },

  // Tabs
  tabs: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
    paddingVertical: 4,
  },
  tab: { fontSize: 18, color: "#666", paddingVertical: 6 },
  activeTab: { color: "#000", fontWeight: "800" },
  tabIndicator: {
    marginTop: 2,
    height: 3,
    width: 36,
    borderRadius: 999,
    backgroundColor: "#000",
  },

  // Header 内容
  headerContent: {
    rowGap: 12,
    paddingBottom: 8,
  },
  profileRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 16,
    paddingHorizontal: 12, // ✅ 改为与 grid 对齐
  },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#eee" },
  statsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stats: { color: "#333", fontSize: 14 },
  bioRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    columnGap: 12,
    paddingHorizontal: 12, // ✅ 对齐
  },
  bio: { flex: 1, fontSize: 15, lineHeight: 20 },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    alignSelf: "flex-start",
  },
  editBtnText: { fontWeight: "600" },
  activeRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  activeTitle: { fontSize: 17, fontWeight: "700" },

  // Empty 状态
  emptyBox: {
    marginTop: 10,
    marginHorizontal: 16,
    backgroundColor: "#E6F0FF",
    borderRadius: 12,
    padding: 20,
  },
  emptyText: { textAlign: "center", color: "#555" },

  // Grid
  itemBox: {
    flex: 1,
    margin: 2,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f8f8f8",
  },
  itemImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  itemInvisible: {
    backgroundColor: "transparent",
  },
});

