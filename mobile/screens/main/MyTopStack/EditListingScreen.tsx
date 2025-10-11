import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  ScrollView as RNScrollView,
  FlatList,
  Image,
} from "react-native";
import Icon from "../../../components/Icon";
import Header from "../../../components/Header";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MyTopStackParamList } from "./index";

/** --- Options --- */
const CATEGORY_OPTIONS = [
  "Tops",
  "Bottoms",
  "Shoes",
  "Bags",
  "Accessories",
  "Outerwear",
  "Dresses",
  "Others",
];
const CONDITION_OPTIONS = ["Brand New", "Like new", "Good", "Fair", "Poor"];
const SIZE_OPTIONS_CLOTHES = [
  "XXS / EU 32 / UK 4 / US 0",
  "XS / EU 34 / UK 6 / US 2",
  "S / EU 36 / UK 8 / US 4",
  "M / EU 38 / UK 10 / US 6",
  "L / EU 40 / UK 12 / US 8",
  "XL / EU 42 / UK 14 / US 10",
  "XXL / EU 44 / UK 16 / US 12",
  "Free Size",
  "Other",
];
const MATERIAL_OPTIONS = [
  "Cotton",
  "Polyester",
  "Denim",
  "Leather",
  "Corduroy",
  "Wool",
  "Silk",
  "Linen",
  "Nylon",
  "Other",
];
const SHIPPING_OPTIONS = [
  "Free shipping",
  "Buyer pays – based on distance",
  "Buyer pays – fixed fee",
  "Meet-up",
];

/** --- Picker modal --- */
function OptionPicker({
  title,
  visible,
  options,
  value,
  onClose,
  onSelect,
}: {
  title: string;
  visible: boolean;
  options: string[];
  value: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
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
              style={[
                styles.optionRow,
                value === opt && {
                  backgroundColor: "#F3E8FF",
                  borderColor: "#5B21B6",
                },
              ]}
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

export default function EditListingScreen({
  navigation,
}: {
  navigation: NativeStackNavigationProp<MyTopStackParamList>;
}) {
  // 默认值（Brandy Melville）
  const [description, setDescription] = useState(
    "Brand new Brandy Melville Elisha Corduroy Jacket. Features a warm, sherpa lining and a corduroy exterior. Classic brown color, one-size fit, perfect for colder months. Still has the original tags attached."
  );
  const [category, setCategory] = useState("Outerwear");
  const [brand, setBrand] = useState("Brandy Melville");
  const [condition, setCondition] = useState("Brand New");
  const [size, setSize] = useState("M");
  const [material, setMaterial] = useState("Corduroy");
  const [price, setPrice] = useState("35");
  const [shippingOption, setShippingOption] = useState("Buyer pays – based on distance");
  const [location, setLocation] = useState("Singapore");

  // Picker visibility
  const [showCat, setShowCat] = useState(false);
  const [showCond, setShowCond] = useState(false);
  const [showSize, setShowSize] = useState(false);
  const [showMat, setShowMat] = useState(false);
  const [showShip, setShowShip] = useState(false);

  const [images, setImages] = useState([
    "https://th.bing.com/th/id/OIP.S07mGFGvwi2ldQARRcy0ngHaJ4?w=138&h=190&c=7&r=0&o=7&cb=12&dpr=2&pid=1.7&rm=3",
    "https://media.karousell.com/media/photos/products/2019/01/06/brandy_melville_coat_1546784131_d0cba3ab_progressive.jpg",
    "https://media.karousell.com/media/photos/products/2019/01/06/brandy_melville_coat_1546784131_a1ddefe8_progressive.jpg",
  ]);

  const handleDelete = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <Header title="Edit Listing" showBack />

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Photos */}
        <FlatList
          data={images}
          keyExtractor={(_, i) => i.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <View style={styles.photoItem}>
              <Image source={{ uri: item }} style={styles.photoImage} />
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(index)}>
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          ListFooterComponent={
            <TouchableOpacity style={styles.addPhotoBox}>
              <Icon name="add" size={26} color="#999" />
            </TouchableOpacity>
          }
          style={{ marginBottom: 16 }}
        />

        {/* Description */}
        <Text style={styles.sectionTitle}>Description</Text>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: "top" }]}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        {/* Info */}
        <Text style={styles.sectionTitle}>Info</Text>
        <Text style={styles.fieldLabel}>Category</Text>
        <TouchableOpacity style={styles.selectBtn} onPress={() => setShowCat(true)}>
          <Text style={styles.selectValue}>{category}</Text>
        </TouchableOpacity>

        <Text style={styles.fieldLabel}>Brand</Text>
        <TextInput style={styles.input} value={brand} onChangeText={setBrand} />

        <Text style={styles.fieldLabel}>Condition</Text>
        <TouchableOpacity style={styles.selectBtn} onPress={() => setShowCond(true)}>
          <Text style={styles.selectValue}>{condition}</Text>
        </TouchableOpacity>

        <Text style={styles.fieldLabel}>Size</Text>
        <TouchableOpacity style={styles.selectBtn} onPress={() => setShowSize(true)}>
          <Text style={styles.selectValue}>{size}</Text>
        </TouchableOpacity>

        <Text style={styles.fieldLabel}>Material</Text>
        <TouchableOpacity style={styles.selectBtn} onPress={() => setShowMat(true)}>
          <Text style={styles.selectValue}>{material}</Text>
        </TouchableOpacity>

        {/* Price */}
        <Text style={styles.sectionTitle}>Price</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />

        {/* Shipping */}
        <Text style={styles.sectionTitle}>Shipping</Text>
        <Text style={styles.fieldLabel}>Shipping option</Text>
        <TouchableOpacity style={styles.selectBtn} onPress={() => setShowShip(true)}>
          <Text style={styles.selectValue}>{shippingOption}</Text>
        </TouchableOpacity>

        <Text style={styles.fieldLabel}>Location</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} />

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.draftBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.draftText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.postBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.postText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Pickers */}
      <OptionPicker
        title="Select category"
        visible={showCat}
        options={CATEGORY_OPTIONS}
        value={category}
        onClose={() => setShowCat(false)}
        onSelect={setCategory}
      />
      <OptionPicker
        title="Select condition"
        visible={showCond}
        options={CONDITION_OPTIONS}
        value={condition}
        onClose={() => setShowCond(false)}
        onSelect={setCondition}
      />
      <OptionPicker
        title="Select size"
        visible={showSize}
        options={SIZE_OPTIONS_CLOTHES}
        value={size}
        onClose={() => setShowSize(false)}
        onSelect={setSize}
      />
      <OptionPicker
        title="Select material"
        visible={showMat}
        options={MATERIAL_OPTIONS}
        value={material}
        onClose={() => setShowMat(false)}
        onSelect={setMaterial}
      />
      <OptionPicker
        title="Select shipping option"
        visible={showShip}
        options={SHIPPING_OPTIONS}
        value={shippingOption}
        onClose={() => setShowShip(false)}
        onSelect={setShippingOption}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },

  /** --- photo --- */
  photoItem: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 10,
    position: "relative",
  },
  photoImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  deleteBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(255,0,0,0.85)",
    borderRadius: 12,
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: { color: "#fff", fontSize: 13, fontWeight: "700", lineHeight: 16 },
  addPhotoBox: {
    width: 90,
    height: 90,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },

  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 12, marginBottom: 8 },
  fieldLabel: { fontSize: 14, fontWeight: "500", color: "#333", marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 15,
    backgroundColor: "#fafafa",
  },
  selectBtn: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    width: "100%",
  },
  selectValue: { fontSize: 15, color: "#111" },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  draftBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
    marginRight: 8,
  },
  draftText: { fontWeight: "600", fontSize: 16 },
  postBtn: {
    flex: 1,
    backgroundColor: "#000",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
    marginLeft: 8,
  },
  postText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  sheetMask: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#DDD",
    marginBottom: 8,
  },
  sheetTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  optionRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionText: { fontSize: 15, color: "#111" },
  sheetCancel: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F6F6F6",
    alignItems: "center",
  },
});
