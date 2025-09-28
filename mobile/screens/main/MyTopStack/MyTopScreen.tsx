import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

import { DEFAULT_AVATAR } from "../../../constants/assetUrls";
import Icon from "../../../components/Icon";

export default function MyTopScreen() {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 顶部：用户名 + 设置 */}
        <View style={styles.header}>
          <Text style={styles.username}>{mockUser.username}</Text>
          <TouchableOpacity onPress={() => { /* TODO: go to settings */ }}>
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
          <TouchableOpacity style={styles.editBtn} onPress={() => {}}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Active + Filter */}
        <View style={styles.activeRow}>
          <Text style={styles.activeTitle}>Active (0 listings)</Text>
          <TouchableOpacity onPress={() => { /* TODO: open filters */ }}>
            <Icon name="filter" size={24} color="#111" />
          </TouchableOpacity>
        </View>

        {/* 空状态 */}
        {activeTab === "Shop" ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              You haven't listed anything for sale yet.{"\n"}Tap + below to get
              started.
            </Text>
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{activeTab} is empty for now.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 96,
    rowGap: 12,
  },

  // Header
  header: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  username: { fontSize: 18, fontWeight: "700" },
  // Tabs
  tabs: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
  },
  tab: { fontSize: 18, color: "#666", paddingVertical: 6 },
  activeTab: { color: "#000", fontWeight: "800" },
  tabIndicator: {
    marginTop: 4,
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
    alignItems: "flex-start", // 改为顶对齐，使按钮与 bio 首行对齐
    justifyContent: "space-between",
    columnGap: 12,
  },
  bio: { flex: 1, fontSize: 15, lineHeight: 20 },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    alignSelf: "flex-start", // 确保按钮自身也靠上对齐
  },
  editBtnText: { fontWeight: "600" },

  // Active
  activeRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeTitle: { fontSize: 17, fontWeight: "700" },

  // Empty
  emptyBox: {
    marginTop: 10,
    backgroundColor: "#E6F0FF",
    borderRadius: 12,
    padding: 20,
  },
  emptyText: { textAlign: "center", color: "#555" },
});
