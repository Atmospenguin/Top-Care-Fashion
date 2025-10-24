import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from "react-native";
import Header from "../../../components/Header";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MyTopStackParamList } from "./index";
import { userService } from "../../../src/services/userService";

const ALL_BRANDS = [
  "Nike",
  "Adidas",
  "Zara",
  "H&M",
  "Uniqlo",
  "Levi's",
  "Converse",
  "Calvin Klein",
  "New Balance",
  "Puma",
  "Under Armour",
  "Gucci",
  "Prada",
  "Chanel",
  "The North Face",
  "Dr. Martens",
  "Brandy Melville",
  "Off-White",
];

type EditBrandNav = NativeStackNavigationProp<MyTopStackParamList, "EditBrand">;
type EditBrandRoute = RouteProp<MyTopStackParamList, "EditBrand">;

export default function EditBrandScreen() {
  const navigation = useNavigation<EditBrandNav>();
  const route = useRoute<EditBrandRoute>();
  const [saving, setSaving] = useState(false);
  const brandOptions = useMemo(() => {
    const fromRoute = route.params?.availableBrands;
    // Always start with ALL_BRANDS, then merge in backend brands
    const backendBrands = Array.isArray(fromRoute)
      ? fromRoute
          .map((brand) => (typeof brand === "string" ? brand.trim() : ""))
          .filter(Boolean)
      : [];
    
    // Combine ALL_BRANDS + backend brands, keeping unique entries (case-insensitive)
    const combined = [...ALL_BRANDS, ...backendBrands];
    const seen = new Set<string>();
    const unique = combined.filter((brand) => {
      const lower = brand.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
    
    return unique;
  }, [route.params?.availableBrands]);

  const initialBrands = useMemo(() => {
    const fromRoute = route.params?.selectedBrands;
    if (Array.isArray(fromRoute) && fromRoute.length > 0) {
      const filtered = fromRoute.filter((brand) =>
        brandOptions.some((option) => option.toLowerCase() === brand.toLowerCase())
      );
      return filtered.length > 0 ? filtered : fromRoute;
    }
    if (brandOptions.length > 0) {
      return brandOptions.slice(0, Math.min(brandOptions.length, 3));
    }
    return ["Nike", "Adidas", "Zara"];
  }, [route.params?.selectedBrands, brandOptions]);

  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialBrands);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    setSelectedBrands(initialBrands);
  }, [initialBrands]);

  const filteredBrands = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) {
      return brandOptions;
    }
    return brandOptions.filter((brand) =>
      brand.toLowerCase().includes(query)
    );
  }, [brandOptions, searchText]);

  const toggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter((b) => b !== brand));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };

  const handleSave = async () => {
    if (selectedBrands.length === 0 || saving) return;
    const source = route.params?.source ?? "mytop";
    if (source === "discover") {
      try {
        setSaving(true);
        await userService.updateProfile({ preferredBrands: selectedBrands });
        // Navigate back to Discover and trigger refresh
        navigation
          .getParent()
          ?.navigate("Discover", { screen: "DiscoverMain", params: { refreshTS: Date.now() } });
      } catch (e) {
        // noop; could show a toast later
      } finally {
        setSaving(false);
      }
    } else {
      navigation.navigate("MyPreference", {
        selectedBrands,
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title="Show these brands in search" showBack />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 选中计数 */}
        <View style={styles.selectedBox}>
          <Text style={styles.selectedText}>
            You've selected {selectedBrands.length} brand
            {selectedBrands.length !== 1 ? "s" : ""}
          </Text>

          {/* 选中品牌 chip */}
          <View style={styles.selectedChips}>
            {selectedBrands.map((brand) => (
              <TouchableOpacity
                key={brand}
                style={styles.selectedChip}
                onPress={() => toggleBrand(brand)}
              >
                <Text style={styles.selectedChipText}>{brand}</Text>
                <Text style={styles.chipClose}>×</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 搜索框 */}
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Search brands"
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        {/* 推荐品牌 */}
        <Text style={styles.sectionTitle}>SUGGESTED</Text>
        <View style={styles.brandGrid}>
          {filteredBrands.map((brand) => {
            const isSelected = selectedBrands.includes(brand);
            return (
              <TouchableOpacity
                key={brand}
                style={[
                  styles.brandChip,
                  isSelected && styles.brandChipSelected,
                ]}
                onPress={() => toggleBrand(brand)}
              >
                <Text
                  style={[
                    styles.brandChipText,
                    isSelected && styles.brandChipTextSelected,
                  ]}
                >
                  {brand}
                </Text>
                <Text
                  style={[
                    styles.plusIcon,
                    isSelected && { color: "#fff" },
                  ]}
                >
                  {isSelected ? "×" : "+"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* 底部 Save 按钮 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveBtn,
            {
              backgroundColor:
                selectedBrands.length > 0 && !saving ? "#000" : "#ccc",
            },
          ]}
          disabled={selectedBrands.length === 0 || saving}
          onPress={handleSave}
        >
          <Text style={styles.saveText}>{saving ? "Saving..." : "Save"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  selectedBox: {
    backgroundColor: "#f7f7f7",
    padding: 12,
    paddingTop: 16,
  },
  selectedText: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 8,
  },
  selectedChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedChip: {
    flexDirection: "row",
    backgroundColor: "#000",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  selectedChipText: {
    color: "#fff",
    fontWeight: "600",
    marginRight: 4,
  },
  chipClose: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 2,
  },
  searchBox: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  searchInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  brandGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 16,
  },
  brandChip: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  brandChipSelected: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  brandChipText: {
    fontSize: 15,
    fontWeight: "500",
  },
  brandChipTextSelected: {
    color: "#fff",
  },
  plusIcon: {
    color: "#000",
    fontSize: 16,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#fff",
    borderTopColor: "#eee",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
