import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";

import Header from "../../../components/Header";
import type { DiscoverStackParamList } from "./index";

type CategoryDetailRoute = RouteProp<DiscoverStackParamList, "CategoryDetail">;

type GenderKey = "men" | "women" | "unisex";

type CategoryMap = Record<
  GenderKey,
  Record<string, string[]>
>;

const DATA: CategoryMap = {
  men: {
    Tops: ["T-shirts", "Hoodies", "Shirts", "Sweaters", "Crop tops", "Tank tops", "Other"],
    Bottoms: ["Jeans", "Pants", "Shorts", "Skirts", "Leggings", "Other"],
    Outerwear: ["Jackets", "Coats", "Vests", "Blazers", "Other"],
    Footwear: ["Sneakers", "Boots", "Loafers", "Sandals", "Slippers", "Other"],
    Accessories: [
      "Bags",
      "Hats and caps",
      "Jewelry",
      "Sunglasses",
      "Watches",
      "Scarves",
      "Belts",
      "Other",
    ],
  },
  women: {
    Tops: ["T-shirts", "Blouses", "Crop tops", "Tank tops", "Hoodies", "Sweaters", "Other"],
    Bottoms: ["Jeans", "Skirts", "Pants", "Leggings", "Shorts", "Other"],
    Outerwear: ["Jackets", "Coats", "Blazers", "Cardigans", "Other"],
    Footwear: ["Sneakers", "Boots", "Heels", "Flats", "Sandals", "Other"],
    Accessories: ["Bags", "Jewelry", "Sunglasses", "Belts", "Hair accessories", "Other"],
    Dresses: ["Mini dresses", "Midi dresses", "Maxi dresses", "Bodycon", "Other"],
  },
  unisex: {
    Tops: ["T-shirts", "Hoodies", "Shirts", "Sweaters", "Other"],
    Bottoms: ["Jeans", "Pants", "Shorts", "Joggers", "Other"],
    Outerwear: ["Jackets", "Coats", "Vests", "Other"],
    Footwear: ["Sneakers", "Boots", "Sandals", "Other"],
    Accessories: ["Bags", "Hats and caps", "Sunglasses", "Jewelry", "Other"],
    Dresses: ["Casual dresses", "Oversized shirt dresses", "Other"],
  },
};

export default function CategoryDetailScreen() {
  const { params } = useRoute<CategoryDetailRoute>();
  const { gender, mainCategory } = params;

  const subcategories = useMemo(() => DATA[gender]?.[mainCategory] ?? [], [gender, mainCategory]);

  return (
    <View style={styles.container}>
      <Header
        title={mainCategory}
        showBack
        bgColor="#fff"
        textColor="#000"
        iconColor="#111"
      />
      {subcategories.map((item) => (
        <TouchableOpacity key={item} style={styles.item}>
          <Text style={styles.text}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
  item: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  text: { fontSize: 17, color: "#111" },
});
