import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "../../../components/Icon";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BuyStackParamList } from "../BuyStack/index";
import type { NativeStackNavigationProp as BuyNav } from "@react-navigation/native-stack";

import type { MyTopStackParamList } from "../MyTopStack";
import type { DiscoverStackParamList } from "./index";

type MainTabParamList = {
  Home: undefined;
  Discover: undefined;
  Sell: undefined;
  Inbox: undefined;
  "My TOP": NavigatorScreenParams<MyTopStackParamList> | undefined;
};

type DiscoverNavigation = NativeStackNavigationProp<DiscoverStackParamList>;

const CATEGORY_OPTIONS: Array<{ label: string; value: "men" | "women" | "unisex" }> = [
  { label: "Men", value: "men" },
  { label: "Women", value: "women" },
  { label: "Unisex", value: "unisex" },
];

export default function DiscoverMainScreen() {
  const navigation = useNavigation<DiscoverNavigation>();
  const [searchText, setSearchText] = useState("");
  const brands = [
    "Nike",
    "Zara",
    "Adidas",
    "Dr. Martens",
    "Levi's",
    "Gucci",
    "Off-White",
    "ASOS",
    "Brandy Melville",
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
        placeholder="Search for Anything"
        placeholderTextColor="#666"
        value={searchText}
        onChangeText={setSearchText}
        returnKeyType="search"
        onSubmitEditing={() => {
          // Navigate to SearchResult in Buy stack (allow empty string)
          // Use parent/root navigator to reach the Buy stack
          const parent = navigation.getParent();
          parent?.navigate("Buy", { screen: "SearchResult", params: { query: searchText || "" } });
        }}
      />

      {/* 分类 */}
      <Text style={styles.sectionTitle}>Shop by Category</Text>
      {CATEGORY_OPTIONS.map(({ label, value }) => (
        <TouchableOpacity
          key={value}
          style={styles.categoryRow}
          onPress={() =>
            navigation.navigate("DiscoverCategory", {
              gender: value,
            })
          }
        >
          <Text style={styles.categoryText}>{label}</Text>
          <Icon name="chevron-forward" size={18} color="#888" />
        </TouchableOpacity>
      ))}

      {/* 品牌 */}
      <View style={styles.brandHeader}>
        <Text style={styles.sectionTitle}>Brands</Text>
        <TouchableOpacity
          onPress={() =>
            navigation
              .getParent<BottomTabNavigationProp<MainTabParamList>>()
              ?.navigate("My TOP", {
                screen: "EditBrand",
              })
          }
        >
          <Text style={styles.selectBrands}>Select Brands</Text>
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
