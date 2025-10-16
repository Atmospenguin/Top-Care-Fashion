import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import type { MyTopStackParamList, PreferenceSizes } from "./index";

type PrefNav = NativeStackNavigationProp<MyTopStackParamList, "MyPreference">;
type PrefRoute = RouteProp<MyTopStackParamList, "MyPreference">;

const STYLE_OPTIONS = [
  {
    id: "1",
    name: "90s/Y2K",
    image:
      "https://images.unsplash.com/photo-1603252110263-fb7b4a4a17b1?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "2",
    name: "Vintage",
    image:
      "https://images.unsplash.com/photo-1602407294553-eede84d9c725?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "3",
    name: "Streetwear",
    image:
      "https://images.unsplash.com/photo-1583743814966-8936f5b7d6a7?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "4",
    name: "Sportswear",
    image:
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=600&auto=format&fit=crop",
  },
];

const BRAND_OPTIONS = ["Alexander Wang", "Nike", "Adidas"];

const STYLE_IMAGE_MAP = STYLE_OPTIONS.reduce<Record<string, string>>(
  (acc, style) => {
    acc[style.name] = style.image;
    return acc;
  },
  {}
);

export default function MyPreferenceScreen() {
  const navigation = useNavigation<PrefNav>();
  const route = useRoute<PrefRoute>();
  const [selectedGender, setSelectedGender] = useState("Womenswear");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(BRAND_OPTIONS);
  const [selectedSizes, setSelectedSizes] = useState<PreferenceSizes>({});

  useFocusEffect(
    useCallback(() => {
      if (route.params?.selectedStyles) {
        setSelectedStyles(route.params.selectedStyles);
      }
      if (route.params?.selectedBrands) {
        setSelectedBrands(route.params.selectedBrands);
      }
      if (route.params?.selectedSizes) {
        setSelectedSizes(route.params.selectedSizes);
      }
    }, [route.params])
  );

  const handleRemoveStyle = useCallback((name: string) => {
    setSelectedStyles((prev) => prev.filter((item) => item !== name));
  }, []);

  const handleRemoveBrand = useCallback((name: string) => {
    setSelectedBrands((prev) => prev.filter((item) => item !== name));
  }, []);

  const hasSizes = useMemo(
    () => Boolean(selectedSizes.shoe || selectedSizes.top || selectedSizes.bottom),
    [selectedSizes]
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title="Preference" showBack />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        

        <Text style={styles.sectionTitle}>Gender Interest</Text>
        {["Menswear", "Mens & Womenswear", "Womenswear"].map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[
              styles.genderRow,
              selectedGender === opt && styles.genderRowSelected,
            ]}
            onPress={() => setSelectedGender(opt)}
          >
            <Text
              style={[
                styles.genderText,
                selectedGender === opt && styles.genderTextSelected,
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Sizes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sizes</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("AddSize", {
                selectedSizes,
              })
            }
          >
            <Text style={styles.editRed}>
              {hasSizes ? "Edit sizes" : "Add sizes"}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sizeLabel}>Shoes</Text>
        <Text style={hasSizes && selectedSizes.shoe ? styles.sizeValue : styles.sizeEmpty}>
          {selectedSizes.shoe ?? "No shoe sizes picked"}
        </Text>
        <Text style={styles.sizeLabel}>Tops</Text>
        <Text style={hasSizes && selectedSizes.top ? styles.sizeValue : styles.sizeEmpty}>
          {selectedSizes.top ?? "No top sizes picked"}
        </Text>
        <Text style={styles.sizeLabel}>Bottoms</Text>
        <Text style={hasSizes && selectedSizes.bottom ? styles.sizeValue : styles.sizeEmpty}>
          {selectedSizes.bottom ?? "No bottom sizes picked"}
        </Text>

        {/* Styles */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Styles</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("AddStyle", {
                selectedStyles,
              })
            }
          >
            <Text style={styles.editRed}>
              {selectedStyles.length > 0 ? "Edit styles" : "Add styles"}
            </Text>
          </TouchableOpacity>
        </View>

        {selectedStyles.length === 0 ? (
          <Text style={styles.sizeEmpty}>No styles picked</Text>
        ) : (
          <View style={styles.styleGrid}>
            {selectedStyles.map((styleName) => {
              const image = STYLE_IMAGE_MAP[styleName];
              return (
                <View key={styleName} style={styles.styleCard}>
                  <Image
                    source={{ uri: image }}
                    style={styles.styleImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.styleOverlay}
                    onPress={() => handleRemoveStyle(styleName)}
                    hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                  >
                    <Icon name="remove-circle" size={22} color="#F54B3D" />
                  </TouchableOpacity>
                  <Text style={styles.styleName}>{styleName}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Brands */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Brands</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("EditBrand", {
                selectedBrands,
              })
            }
          >
            <Text style={styles.editRed}>
              {selectedBrands.length > 0 ? "Edit brands" : "Add brands"}
            </Text>
          </TouchableOpacity>
        </View>

        {selectedBrands.length === 0 ? (
          <Text style={styles.sizeEmpty}>No brands picked</Text>
        ) : (
          <View style={styles.brandWrap}>
            {selectedBrands.map((brand) => (
              <View key={brand} style={styles.brandChip}>
                <Text style={styles.brandText}>{brand}</Text>
                <TouchableOpacity
                  style={{ marginLeft: 4 }}
                  onPress={() => handleRemoveBrand(brand)}
                  hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                >
                  <Icon name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 8 },
  subHeading: { fontSize: 15, fontWeight: "600", marginTop: 8 },
  editRed: { color: "#F54B3D", fontWeight: "600" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
  },
  genderRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
    paddingVertical: 12,
  },
  genderRowSelected: { backgroundColor: "#f9f9f9" },
  genderText: { fontSize: 15, color: "#111" },
  genderTextSelected: { fontWeight: "700", color: "#111" },
  sizeLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
  },
  sizeValue: {
    fontSize: 14,
    color: "#111",
    fontWeight: "600",
    marginBottom: 6,
  },
  sizeEmpty: { fontSize: 14, color: "#777", marginBottom: 6 },
  styleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
    marginTop: 10,
  },
  styleCard: { width: "48%", alignItems: "center" },
  styleImage: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  styleOverlay: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  styleName: {
    marginTop: 6,
    fontWeight: "700",
    color: "#111",
  },
  brandWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  brandChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  brandText: { color: "#fff", fontWeight: "600" },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e6e6e6",
    backgroundColor: "#fff",
  },
  saveBtn: {
    backgroundColor: "#000",
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: "center",
    width: "100%",
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
