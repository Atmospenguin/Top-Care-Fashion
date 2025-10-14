import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import type { MyTopStackParamList } from "./index";

type Nav = NativeStackNavigationProp<MyTopStackParamList, "BoostedListing">;

const BOOSTED = [
  {
    id: "b1",
    title: "Flower pattern shirt, great condition",
    size: "UK 10",
    price: 50,
    image:
      "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=600&auto=format&fit=crop",
    boostedAgo: "1 day ago",
    views: 120,
    clicks: 34,
    viewUplift: "+110% from boosting",
    clickUplift: "+30% from boosting",
  },
  {
    id: "b2",
    title: "Blue dungarees, wide leg and comfy",
    size: "UK 10",
    price: 55,
    image:
      "https://images.unsplash.com/photo-1520975652208-8bdf0a1a3f3c?q=80&w=600&auto=format&fit=crop",
    boostedAgo: "1 day ago",
    views: 210,
    clicks: 41,
    viewUplift: "+80% from boosting",
    clickUplift: "+60% from boosting",
  },
];

export default function BoostedListingScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title="Boosted listings" showBack />

      {/* How stats work 卡片 */}
      <View style={styles.infoCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Icon name="information-circle-outline" size={18} color="#111" />
          <Text style={styles.infoTitle}>How stats work</Text>
        </View>
        <Text style={styles.infoText}>
          Numbers shown are total views and clicks, tracked from the time of
          boosting.
        </Text>
        <TouchableOpacity>
          <Text style={styles.learnMore}>Learn more</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={BOOSTED}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={styles.boostRow}>
            <Image source={{ uri: item.image }} style={styles.thumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.rowMeta}>
                {item.size} • £{item.price}
              </Text>
              <Text style={styles.rowSub}>Boosted {item.boostedAgo}</Text>

              {/* 统计 */}
              <View style={styles.metricRow}>
                <View style={styles.metricPill}>
                  <Icon name="eye-outline" size={16} color="#111" />
                  <Text style={styles.metricText}>{item.views} views</Text>
                </View>
                <View style={styles.upliftPill}>
                  <Icon name="arrow-up" size={14} color="#1f7a1f" />
                  <Text style={styles.upliftText}>{item.viewUplift}</Text>
                </View>
              </View>
              <View style={[styles.metricRow, { marginTop: 6 }]}>
                <View style={styles.metricPill}>
                  <Icon name="push-outline" size={16} color="#111" />
                  <Text style={styles.metricText}>{item.clicks} clicks</Text>
                </View>
                <View style={styles.upliftPill}>
                  <Icon name="arrow-up" size={14} color="#1f7a1f" />
                  <Text style={styles.upliftText}>{item.clickUplift}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    rowGap: 6,
  },
  infoTitle: { fontWeight: "700", fontSize: 15, color: "#111" },
  infoText: { color: "#444", lineHeight: 18 },
  learnMore: { color: "#3b82f6", fontWeight: "600", marginTop: 2 },

  boostRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
    gap: 12,
  },
  thumb: { width: 66, height: 66, borderRadius: 10, backgroundColor: "#eee" },
  rowTitle: { fontWeight: "700", color: "#111" },
  rowMeta: { color: "#111", marginTop: 2 },
  rowSub: { color: "#666", marginTop: 2, fontSize: 12 },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  metricPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f6f6f6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },
  metricText: { color: "#111" },
  upliftPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#DDF6DD",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  upliftText: { color: "#1f7a1f", fontWeight: "700", fontSize: 12 },
});
