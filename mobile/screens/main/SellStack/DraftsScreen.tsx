import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from "react-native";
// Keep SafeAreaView inside Header only; avoid double SafeArea padding here
import Header from "../../../components/Header";
import Icon from "../../../components/Icon";

type Draft = {
  id: string;
  description: string;
  date: string;
  thumbnail?: string;
};

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { SellStackParamList } from "./SellStackNavigator";

type DraftsScreenProps = {
  navigation: NativeStackNavigationProp<SellStackParamList, "Drafts">;
};

export default function DraftsScreen({ navigation }: DraftsScreenProps) {
  // 模拟一些草稿数据
  const [drafts, setDrafts] = useState<Draft[]>([
    {
      id: "1",
      description: "Blue and white Ader Error x Converse trainers #sneakers",
      date: "2025-10-02 09:45",
      thumbnail: "https://via.placeholder.com/60", // 以后替换成 asset URL
    },
    {
      id: "2",
      description: "Zara beige coat, worn twice, very good condition",
      date: "2025-10-01 22:30",
    },
  ]);

  const clearDrafts = () => setDrafts([]);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header
        title="Drafts"
        showBack
        rightAction={
          drafts.length > 0 ? (
            <TouchableOpacity onPress={clearDrafts}>
              <Icon name="trash-outline" size={22} color="#111" />
            </TouchableOpacity>
          ) : null
        }
      />

      {drafts.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No drafts yet</Text>
        </View>
      ) : (
        <FlatList
          data={drafts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.draftRow}
              onPress={() => navigation.navigate("SellMain", { draftId: item.id })}
            >
              {item.thumbnail ? (
                <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Icon name="image-outline" size={22} color="#aaa" />
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text numberOfLines={1} style={styles.desc}>
                  {item.description}
                </Text>
                <Text style={styles.date}>{item.date}</Text>
              </View>
              <Icon name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  draftRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  thumb: { width: 50, height: 50, borderRadius: 6, backgroundColor: "#eee" },
  thumbPlaceholder: { justifyContent: "center", alignItems: "center" },
  desc: { fontSize: 15, fontWeight: "500", marginBottom: 2 },
  date: { fontSize: 12, color: "#777" },
  emptyBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#999" },
});
