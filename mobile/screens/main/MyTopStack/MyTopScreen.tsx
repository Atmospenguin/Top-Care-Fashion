import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DEFAULT_AVATAR } from "../../../constants/assetUrls";
import Icon from "../../../components/Icon";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MyTopStackParamList } from "./index";
import SoldTab from "./SoldTab";
import PurchasesTab from "./PurchasesTab";
import LikesTab from "./LikesTab";


export default function MyTopScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MyTopStackParamList>>();
  const [activeTab, setActiveTab] =
    useState<"Shop" | "Sold" | "Purchases" | "Likes">("Shop");

  const mockUser = {
    username: "ccc446981",
    followers: 0,
    following: 0,
    reviews: 0,
    bio: "My name is Pink, and I'm really glad to meet you",
    avatar: DEFAULT_AVATAR,
    activeListings: [],
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
              <Text
                style={[styles.tab, activeTab === tab && styles.activeTab]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </View>
        ))}
      </View>

      {/* 内容区：不同 Tab 自己决定要不要滚动 */}
      <View style={{ flex: 1 }}>
        {activeTab === "Shop" && (
          <ScrollView contentContainerStyle={styles.content}>
            {/* 用户信息 */}
            <View style={styles.profileRow}>
              <Image source={mockUser.avatar} style={styles.avatar} />
              <View style={styles.statsRow}>
                <Text style={styles.stats}>{mockUser.followers} followers</Text>
                <Text style={styles.stats}>{mockUser.following} following</Text>
                <Text style={styles.stats}>{mockUser.reviews} reviews</Text>
              </View>
            </View>

            {/* Bio + 编辑按钮 */}
            <View style={styles.bioRow}>
              <Text style={styles.bio}>{mockUser.bio}</Text>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate("EditProfile")}
              >
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Active + Filter */}
            <View style={styles.activeRow}>
              <Text style={styles.activeTitle}>Active (0 listings)</Text>
              <TouchableOpacity onPress={() => {}}>
                <Icon name="filter" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            {/* 空状态 */}
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                You haven't listed anything for sale yet.{"\n"}Tap + below to
                get started.
              </Text>
            </View>
          </ScrollView>
        )}

        {activeTab === "Sold" && <SoldTab />}

        {activeTab === "Purchases" && <PurchasesTab />}


        {activeTab === "Likes" && <LikesTab />}
        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 96,
    rowGap: 12,
  },

  // Header
  header: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  username: { fontSize: 18, fontWeight: "700" },

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

  // Profile
  profileRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 16,
    paddingHorizontal: 16,
  },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#eee" },
  statsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stats: { color: "#333", fontSize: 14 },

  // Bio
  bioRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    columnGap: 12,
    paddingHorizontal: 16,
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

  // Active
  activeRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  activeTitle: { fontSize: 17, fontWeight: "700" },

  // Empty
  emptyBox: {
    marginTop: 10,
    marginHorizontal: 16,
    backgroundColor: "#E6F0FF",
    borderRadius: 12,
    padding: 20,
  },
  emptyText: { textAlign: "center", color: "#555" },
});
