import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "../../../components/Icon";

export default function DiscoverScreen() {
  const categories = ["Men", "Women", "Kids", "Everything else"];
  const brands = [
    "Nike",
    "Zara",
    "Adidas",
    "Dr. Martens",
    "Levi's",
    "Gucci",
    "Off-White",
    "Brandy Melville",
    "ASOS",
    "Chanel",
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      {/* 搜索栏 */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search for anything"
        placeholderTextColor="#666"
      />

      {/* 分类 */}
      <Text style={styles.sectionTitle}>Shop by category</Text>
      {categories.map((c) => (
        <TouchableOpacity key={c} style={styles.categoryRow}>
          <Text style={styles.categoryText}>{c}</Text>
          <Icon name="chevron-forward" size={18} color="#888" />
        </TouchableOpacity>
      ))}

      {/* 品牌 */}
      <View style={styles.brandHeader}>
        <Text style={styles.sectionTitle}>Brands</Text>
        <TouchableOpacity>
          <Text style={styles.selectBrands}>Select brands</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.brandWrap}>
        {brands.map((b) => (
          <TouchableOpacity key={b} style={styles.brandTag}>
            <Text style={styles.brandText}>{b}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },

  searchBar: {
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f3f3f3",
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },

  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  categoryText: { fontSize: 15, color: "#111" },

  brandHeader: {
    marginTop: 20,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectBrands: { fontSize: 14, color: "#5B21B6", fontWeight: "600" },

  brandWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  brandTag: {
    backgroundColor: "#111",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  brandText: { color: "#fff", fontSize: 14, fontWeight: "500" },
});
