import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "../../../components/Icon";

export default function HomeScreen() {
  const suggestedItems = [
    { id: 1, title: "Lululemon", price: 45, img: "https://via.placeholder.com/150" },
    { id: 2, title: "Sweater", price: 74, img: "https://via.placeholder.com/150" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* 🔍 搜索栏 */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search for anything"
          placeholderTextColor="#666"
        />
        <TouchableOpacity style={{ marginLeft: 12 }} accessibilityRole="button">
          <Icon name="heart-outline" size={22} color="#111" />
        </TouchableOpacity>
        <TouchableOpacity style={{ marginLeft: 12 }} accessibilityRole="button">
          <Icon name="bag-outline" size={22} color="#111" />
        </TouchableOpacity>
      </View>

      {/* 🌟 Premium Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Style smarter with AI Mix & Match</Text>
        <Text style={styles.bannerSubtitle}>
          Unlimited Mix & Match Styling{"\n"}Reduced commission fees & Free boosts
        </Text>
        <TouchableOpacity style={styles.premiumBtn}>
          <Text style={styles.premiumText}>Get Premium</Text>
        </TouchableOpacity>
      </View>

      {/* 👕 推荐区 */}
      <Text style={styles.sectionTitle}>Suggested for you</Text>
      <View style={styles.grid}>
        {suggestedItems.map((item) => (
          <View key={item.id} style={styles.card}>
            <Image source={{ uri: item.img }} style={styles.itemImg} />
            <Text>{item.title}</Text>
            <Text style={styles.price}>${item.price}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },

  // 搜索
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f3f3f3",
    paddingHorizontal: 16,
    fontSize: 15,
  },

  // Banner
  banner: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  bannerTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  bannerSubtitle: { fontSize: 14, color: "#555", marginBottom: 12 },
  premiumBtn: {
    backgroundColor: "#000",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  premiumText: { color: "#fff", fontWeight: "700" },

  // 推荐
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { width: "48%", marginBottom: 16 },
  itemImg: { width: "100%", height: 120, borderRadius: 8, marginBottom: 6 },
  price: { fontWeight: "700" },
});

