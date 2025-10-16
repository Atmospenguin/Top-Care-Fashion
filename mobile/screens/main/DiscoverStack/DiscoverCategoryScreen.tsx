import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import Header from "../../../components/Header";
import type { DiscoverStackParamList } from "./index";

type DiscoverNavigation = NativeStackNavigationProp<DiscoverStackParamList>;
type DiscoverCategoryRoute = RouteProp<DiscoverStackParamList, "DiscoverCategory">;

const MEN_CATEGORIES = ["Tops", "Bottoms", "Outerwear", "Footwear", "Accessories"] as const;
const EXTENDED_CATEGORIES = [
  "Tops",
  "Bottoms",
  "Outerwear",
  "Footwear",
  "Accessories",
  "Dresses",
] as const;

type CategoryLabel = (typeof MEN_CATEGORIES | typeof EXTENDED_CATEGORIES)[number];

type Gender = "men" | "women" | "unisex";

function getCategories(gender: Gender): CategoryLabel[] {
  if (gender === "men") {
    return [...MEN_CATEGORIES];
  }

  return [...EXTENDED_CATEGORIES];
}

export default function DiscoverCategoryScreen() {
  const navigation = useNavigation<DiscoverNavigation>();
  const { params } = useRoute<DiscoverCategoryRoute>();
  const { gender } = params;

  const categories = useMemo(() => getCategories(gender), [gender]);
  const headerTitle = gender === "men" ? "Men" : gender === "women" ? "Women" : "Unisex";

  return (
    <View style={styles.container}>
      <Header
        title={headerTitle}
        showBack
        bgColor="#fff"
        textColor="#000"
        iconColor="#111"
      />
      {categories.map((category) => (
        <TouchableOpacity
          key={category}
          style={styles.item}
          onPress={() =>
            navigation.navigate("CategoryDetail", {
              gender,
              mainCategory: category,
            })
          }
        >
          <Text style={styles.text}>{category}</Text>
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
