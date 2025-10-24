import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import { listingsService } from "../../../src/services/listingsService";
import { userService } from "../../../src/services/userService";
import { useAuth } from "../../../contexts/AuthContext";
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

const FALLBACK_BRANDS = ["Alexander Wang", "Nike", "Adidas"];

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
  const { updateUser } = useAuth();
  const [selectedGender, setSelectedGender] = useState("Womenswear");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(FALLBACK_BRANDS);
  const [selectedSizes, setSelectedSizes] = useState<PreferenceSizes>({});
  const [availableBrands, setAvailableBrands] = useState<string[]>(FALLBACK_BRANDS);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadPreferences = async () => {
      try {
        setLoadError(null);
        const [profile, brandSummaries] = await Promise.all([
          userService.getProfile(),
          listingsService.getBrandSummaries({ limit: 60 }),
        ]);

        if (!isActive) return;

        const brandNames = brandSummaries
          .map((item) => item.name)
          .filter((name): name is string => Boolean(name && name.trim()));

        if (brandNames.length > 0) {
          setAvailableBrands(brandNames);
        }

        if (profile) {
          const rawBrands = Array.isArray((profile as any).preferred_brands)
            ? (profile as any).preferred_brands
            : null;
          if (Array.isArray(rawBrands)) {
            const normalizedBrands = rawBrands.filter(
              (item: unknown): item is string => typeof item === "string",
            );
            setSelectedBrands(normalizedBrands);
          } else if (brandNames.length > 0) {
            setSelectedBrands(brandNames.slice(0, Math.min(brandNames.length, 3)));
          }

          const rawStyles = Array.isArray((profile as any).preferred_styles)
            ? (profile as any).preferred_styles
            : null;
          if (Array.isArray(rawStyles)) {
            const normalizedStyles = rawStyles.filter(
              (item: unknown): item is string => typeof item === "string",
            );
            setSelectedStyles(normalizedStyles);
          }

          setSelectedSizes({
            shoe: (profile as any).preferred_size_shoe ?? undefined,
            top: (profile as any).preferred_size_top ?? undefined,
            bottom: (profile as any).preferred_size_bottom ?? undefined,
          });
        } else if (brandNames.length > 0) {
          setSelectedBrands(brandNames.slice(0, Math.min(brandNames.length, 3)));
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
        if (isActive) {
          setLoadError("Failed to load preferences. Please try again later.");
          setAvailableBrands(FALLBACK_BRANDS);
        }
      } finally {
        if (isActive) {
          setLoadingPreferences(false);
        }
      }
    };

    loadPreferences();

    return () => {
      isActive = false;
    };
  }, []);

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

  const handleSave = useCallback(async () => {
    try {
      setSaveError(null);
      setSaving(true);

      const updatedUser = await userService.updateProfile({
        preferredStyles: selectedStyles,
        preferredBrands: selectedBrands,
        preferredSizes: {
          shoe: selectedSizes.shoe ?? null,
          top: selectedSizes.top ?? null,
          bottom: selectedSizes.bottom ?? null,
        },
      });

      updateUser(updatedUser);
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save preferences:", error);
      setSaveError("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [navigation, selectedBrands, selectedSizes, selectedStyles, updateUser]);

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
        {loadingPreferences && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#111" />
            <Text style={styles.loadingText}>Loading your preferences...</Text>
          </View>
        )}
        {loadError && <Text style={styles.errorText}>{loadError}</Text>}

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
        <Text style={styles.sizeLabel}>Footwear</Text>
        <Text style={hasSizes && selectedSizes.shoe ? styles.sizeValue : styles.sizeEmpty}>
          {selectedSizes.shoe ?? "No footwear sizes picked"}
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
                availableBrands,
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
        {saveError && <Text style={styles.errorText}>{saveError}</Text>}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            (saving || loadingPreferences) && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={saving || loadingPreferences}
        >
          {saving ? (
            <View style={styles.saveLoadingRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.saveLoadingText}>Saving...</Text>
            </View>
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 8 },
  subHeading: { fontSize: 15, fontWeight: "600", marginTop: 8 },
  editRed: { color: "#F54B3D", fontWeight: "600" },
  errorText: { color: "#B91C1C", fontSize: 13, marginBottom: 8 },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  loadingText: { marginLeft: 8, color: "#555", fontSize: 13 },
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
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  saveLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  saveLoadingText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
});
