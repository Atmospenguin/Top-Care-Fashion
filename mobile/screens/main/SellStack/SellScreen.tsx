import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView as RNScrollView,
  FlatList,
} from "react-native";
// note: keep Header's SafeAreaView; remove outer SafeAreaView to avoid double padding
import Icon from "../../../components/Icon";
import Header from "../../../components/Header"; 
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { SellStackParamList } from "./SellStackNavigator";
/** --- Options --- */
const CATEGORY_OPTIONS = ["Tops", "Bottoms", "Shoes", "Bags", "Accessories", "Outerwear", "Dresses", "Others"];
const BRAND_OPTIONS = ["Nike", "Adidas", "Converse", "New Balance", "Zara", "Uniqlo", "H&M", "Puma", "Levi's", "Others"];
const CONDITION_OPTIONS = ["Brand New", "Like new", "Good", "Fair", "Poor"];
const SHIPPING_OPTIONS = ["Free shipping", "Buyer pays – based on distance", "Buyer pays – fixed fee", "Meet-up"];
const DEFAULT_TAGS = [
  "Vintage",
  "Y2K",
  "Streetwear",
  "Preloved",
  "Minimal",
  "Sporty",
  "Elegant",
  "Retro",
  "Casual",
  "Outdoor",
  "Grunge",
  "Coquette",
  "Cottagecore",
  "Punk",
  "Cyberpunk",
];

/** --- Bottom Sheet Picker --- */
type OptionPickerProps = {
  title: string;
  visible: boolean;
  options: string[];
  value: string;
  onClose: () => void;
  onSelect: (value: string) => void;
};

function OptionPicker({ title, visible, options, value, onClose, onSelect }: OptionPickerProps) {
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.sheetMask} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>{title}</Text>
        <RNScrollView style={{ maxHeight: 360 }}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.optionRow, value === opt && { backgroundColor: "#F3E8FF", borderColor: "#5B21B6" }]}
              onPress={() => {
                onSelect(opt);
                onClose();
              }}
            >
              <Text style={styles.optionText}>{opt}</Text>
              {value === opt ? <Text style={{ color: "#5B21B6" }}>✓</Text> : null}
            </TouchableOpacity>
          ))}
        </RNScrollView>
        <TouchableOpacity style={styles.sheetCancel} onPress={onClose}>
          <Text style={{ fontWeight: "600" }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

type SellScreenNavigationProp = NativeStackNavigationProp<
  SellStackParamList,
  "SellMain"
>;

export default function SellScreen({
  navigation,
}: {
  navigation: SellScreenNavigationProp;
}) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiDesc, setAiDesc] = useState<string | null>(null);

  // Info
  const [category, setCategory] = useState("Select");
  const [condition, setCondition] = useState("Select");
  const [brand, setBrand] = useState("Select");
  const [brandCustomMode, setBrandCustomMode] = useState(false);
  const [brandCustom, setBrandCustom] = useState("");

  // Shipping
  const [shippingOption, setShippingOption] = useState("Select");
  const [shippingFee, setShippingFee] = useState("");
  const [location, setLocation] = useState("");

  // Pickers
  const [showCat, setShowCat] = useState(false);
  const [showCond, setShowCond] = useState(false);
  const [showBrand, setShowBrand] = useState(false);
  const [showShip, setShowShip] = useState(false);

  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [showTagPicker, setShowTagPicker] = useState(false);

  // 模拟 AI
  const generateDescription = async () => {
    setLoading(true);
    setAiDesc(null);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setAiDesc("Stylish mini skirt featuring a pleated design and a decorative belt. The skirt has a unique layered design with a floral print on the bottom layer.");
    } catch (err) {
      console.error("AI generation failed:", err);
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* ✅ 用 Header 组件 */}
      <Header
        title="Sell an item"
        rightAction={
          <TouchableOpacity onPress={() => navigation.navigate("Drafts")} style={{ paddingRight: 4 }}>
            <Icon name="file-tray-outline" size={22} color="#111" />
            {/* ion-icon */}
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* 图片上传 */}
        <FlatList
          data={[...Array(9)]}
          keyExtractor={(_, i) => i.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={() => (
            <TouchableOpacity style={styles.photoBox}>
              <Icon name="add" size={24} color="#999" />
            </TouchableOpacity>
          )}
          style={{ marginBottom: 8 }}
        />
        <Text style={styles.photoTips}>Read our photo tips</Text>

        {/* 描述 */}
        <Text style={styles.sectionTitle}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="eg. small grey Nike t-shirt, only worn a few times"
          multiline
          value={description}
          onChangeText={setDescription}
        />
        <TouchableOpacity style={styles.aiGenBtn} onPress={generateDescription}>
          <Text style={{ color: "#5B21B6", fontWeight: "600" }}>Generate with AI ✨</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator size="small" color="#5B21B6" />}
        {aiDesc && (
          <View style={styles.aiBox}>
            {/* 关闭按钮 */}
            <TouchableOpacity style={styles.closeIcon} onPress={() => setAiDesc(null)}>
              <Icon name="close" size={20} color="#444" />
            </TouchableOpacity>

            <Text style={{ fontWeight: "600", marginBottom: 4 }}>Done! Use this to get started:</Text>
            <Text style={{ marginBottom: 8 }}>{aiDesc}</Text>

            {/* 左边 Use，小按钮；右边 shuffle */}
            <View style={styles.aiActionRow}>
              <TouchableOpacity style={styles.useSmallBtn} onPress={() => setDescription(aiDesc)}>
                <Text style={{ color: "#fff", fontWeight: "600" }}>Use description</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={generateDescription}>
                <Icon name="shuffle" size={20} color="#5B21B6" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Info */}
        <Text style={styles.sectionTitle}>Info</Text>
        <Text style={styles.fieldLabel}>Category</Text>
        <TouchableOpacity style={styles.selectBtn} onPress={() => setShowCat(true)}>
          <Text style={styles.selectValue}>{category}</Text>
        </TouchableOpacity>

        <Text style={styles.fieldLabel}>Brand</Text>
        {!brandCustomMode ? (
          <TouchableOpacity style={styles.selectBtn} onPress={() => setShowBrand(true)}>
            <Text style={styles.selectValue}>{brand}</Text>
          </TouchableOpacity>
        ) : (
          <View>
            <TextInput
              style={styles.input}
              placeholder="Enter brand (eg. Nike, Zara)"
              value={brandCustom}
              onChangeText={setBrandCustom}
            />
            <TouchableOpacity
              style={styles.clearTiny}
              onPress={() => {
                setBrandCustomMode(false);
                setBrand("Select");
                setBrandCustom("");
              }}
            >
              <Text style={{ color: "#5B21B6" }}>← Back to list</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.fieldLabel}>Condition</Text>
        <TouchableOpacity style={styles.selectBtn} onPress={() => setShowCond(true)}>
          <Text style={styles.selectValue}>{condition}</Text>
        </TouchableOpacity>

        {/* Price */}
        <Text style={styles.sectionTitle}>Price</Text>
        <TextInput style={styles.input} placeholder="$ 0.00" keyboardType="numeric" />

        {/* Tags Section */}
        <Text style={styles.sectionTitle}>Tags</Text>
        <Text style={{ color: "#555", marginBottom: 6 }}>
          Add up to 5 tags to help buyers find your item
        </Text>

        <View style={styles.tagContainer}>
          {tags.length === 0 ? (
            <TouchableOpacity
              style={styles.addStyleBtn}
              onPress={() => setShowTagPicker(true)}
            >
              <Icon name="add-circle-outline" size={18} color="#F54B3D" />
              <Text style={styles.addStyleText}>Style</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.selectedTagWrap}>
              {tags.map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>{tag}</Text>
                  <TouchableOpacity
                    onPress={() => setTags(tags.filter((t) => t !== tag))}
                  >
                    <Icon name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {tags.length < 5 && (
                <TouchableOpacity
                  style={styles.addStyleBtnSmall}
                  onPress={() => setShowTagPicker(true)}
                >
                  <Icon name="add" size={16} color="#F54B3D" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        

        {/* Shipping */}
        <Text style={styles.sectionTitle}>Shipping</Text>
        <Text style={styles.fieldLabel}>Shipping option</Text>
        <TouchableOpacity style={styles.selectBtn} onPress={() => setShowShip(true)}>
          <Text style={styles.selectValue}>{shippingOption}</Text>
        </TouchableOpacity>

        {shippingOption === "Buyer pays – fixed fee" && (
          <TextInput
            style={styles.input}
            placeholder="Enter fixed fee (e.g. $3.00)"
            keyboardType="numeric"
            value={shippingFee}
            onChangeText={setShippingFee}
          />
        )}

        <Text style={styles.fieldLabel}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="Location (eg. Bugis, Singapore)"
          value={location}
          onChangeText={setLocation}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.draftBtn}>
            <Text style={styles.draftText}>Save to drafts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.postBtn}>
            <Text style={styles.postText}>Post listing</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Pickers */}
      <OptionPicker title="Select category" visible={showCat} options={CATEGORY_OPTIONS} value={category} onClose={() => setShowCat(false)} onSelect={setCategory} />
      <OptionPicker title="Select brand" visible={showBrand} options={BRAND_OPTIONS} value={brand} onClose={() => setShowBrand(false)} onSelect={setBrand} />
      <OptionPicker title="Select condition" visible={showCond} options={CONDITION_OPTIONS} value={condition} onClose={() => setShowCond(false)} onSelect={setCondition} />
      <OptionPicker title="Select shipping option" visible={showShip} options={SHIPPING_OPTIONS} value={shippingOption} onClose={() => setShowShip(false)} onSelect={setShippingOption} />
      {/* Tag Picker Modal */}
      <TagPickerModal
        visible={showTagPicker}
        onClose={() => setShowTagPicker(false)}
        tags={tags}
        setTags={setTags}
      />
    </View>
  );
}

function TagPickerModal({
  visible,
  onClose,
  tags,
  setTags,
}: {
  visible: boolean;
  onClose: () => void;
  tags: string[];
  setTags: (tags: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [customTag, setCustomTag] = useState("");

  const filtered = DEFAULT_TAGS.filter((t) =>
    t.toLowerCase().includes(search.toLowerCase())
  );

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <Pressable style={styles.sheetMask} onPress={onClose} />
      <View style={styles.tagSheet}>
        {/* Header */}
        <View style={styles.tagSheetHeader}>
          <Text style={styles.tagSheetTitle}>Select tags</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#111" />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <TextInput
          style={styles.tagSearch}
          placeholder="Search tags..."
          value={search}
          onChangeText={setSearch}
        />

        {/* Tag grid */}
        <ScrollView style={{ maxHeight: 360 }}>
          <View style={styles.tagGrid}>
            {filtered.map((t) => {
              const selected = tags.includes(t);
              return (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.tagOption,
                    selected && styles.tagOptionSelected,
                  ]}
                  onPress={() =>
                    selected
                      ? setTags(tags.filter((x) => x !== t))
                      : addTag(t)
                  }
                >
                  <Text
                    style={[
                      styles.tagOptionText,
                      selected && { color: "#fff" },
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Custom Tag */}
        <View style={styles.customTagRow}>
          <TextInput
            style={styles.customTagInput}
            placeholder="Other..."
            value={customTag}
            onChangeText={setCustomTag}
          />
          <TouchableOpacity
            style={styles.customTagAddBtn}
            onPress={() => {
              addTag(customTag.trim());
              setCustomTag("");
            }}
          >
            <Text style={styles.customTagAddText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Done */}
        <TouchableOpacity style={styles.sheetDone} onPress={onClose}>
          <Text style={{ fontWeight: "600" }}>Done</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

/** --- Styles --- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  photoBox: {
    width: 70, height: 70, borderWidth: 1, borderColor: "#ccc", borderRadius: 8,
    justifyContent: "center", alignItems: "center", backgroundColor: "#fafafa", marginRight: 8,
  },
  photoTips: { fontSize: 14, color: "#5B21B6", marginBottom: 16 },

  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 12, marginBottom: 8 },
  fieldLabel: { fontSize: 14, fontWeight: "500", color: "#333", marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 15, backgroundColor: "#fafafa" },

  aiGenBtn: { alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: "#5B21B6", borderRadius: 20, marginBottom: 12 },
  aiBox: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: "#F3E8FF", position: "relative" },
  closeIcon: { position: "absolute", top: 8, right: 8 },
  aiActionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  useSmallBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, backgroundColor: "#5B21B6" },

  selectBtn: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 12, width: "100%" },
  selectValue: { fontSize: 15, color: "#111" },

  clearTiny: { alignSelf: "flex-start", marginTop: -4, marginBottom: 8 },

  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  draftBtn: { flex: 1, borderWidth: 1, borderColor: "#000", borderRadius: 25, paddingVertical: 12, alignItems: "center", marginRight: 8 },
  draftText: { fontWeight: "600", fontSize: 16 },
  postBtn: { flex: 1, backgroundColor: "#000", borderRadius: 25, paddingVertical: 12, alignItems: "center", marginLeft: 8 },
  postText: { color: "#fff", fontWeight: "600", fontSize: 16 },

  sheetMask: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.25)" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  sheetHandle: { alignSelf: "center", width: 44, height: 5, borderRadius: 999, backgroundColor: "#DDD", marginBottom: 8 },
  sheetTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  optionRow: { paddingVertical: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: "#eee", borderRadius: 10, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  optionText: { fontSize: 15, color: "#111" },
  sheetCancel: { marginTop: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: "#F6F6F6", alignItems: "center" },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
  },
  tagText: {
    fontSize: 14,
    marginRight: 4,
  },
  tagInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 90,
    fontSize: 14,
    backgroundColor: "#fafafa",
  },
  suggestedTagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  suggestedTag: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  suggestedTagText: {
    fontSize: 14,
    color: "#111",
  },
  addStyleBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F54B3D",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  addStyleText: {
    color: "#F54B3D",
    fontWeight: "600",
    marginLeft: 4,
  },
  selectedTagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagChipText: {
    color: "#fff",
    fontSize: 14,
    marginRight: 4,
  },
  addStyleBtnSmall: {
    borderWidth: 1,
    borderColor: "#F54B3D",
    borderRadius: 20,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  tagSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  tagSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tagSheetTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  tagSearch: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: "#fafafa",
    marginBottom: 10,
  },
  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagOption: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagOptionSelected: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  tagOptionText: {
    fontSize: 14,
    color: "#111",
  },
  customTagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  customTagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
  },
  customTagAddBtn: {
    backgroundColor: "#F54B3D",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  customTagAddText: {
    color: "#fff",
    fontWeight: "600",
  },
  sheetDone: {
    marginTop: 10,
    backgroundColor: "#F6F6F6",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
});
