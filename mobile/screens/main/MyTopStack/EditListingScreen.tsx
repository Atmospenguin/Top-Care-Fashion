import React, { useState, useEffect } from "react";
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
  Alert,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import Icon from "../../../components/Icon";
import Header from "../../../components/Header";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { MyTopStackParamList } from "./index";
import { listingsService } from "../../../src/services/listingsService";
import type { ListingItem } from "../../../src/types/shop";

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

export default function EditListingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MyTopStackParamList>>();
  const route = useRoute<RouteProp<MyTopStackParamList, "EditListing">>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listing, setListing] = useState<ListingItem | null>(null);

  // ✅ 表单状态
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("");
  const [size, setSize] = useState("");
  const [material, setMaterial] = useState("");
  const [price, setPrice] = useState("");
  const [shippingOption, setShippingOption] = useState("");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState<string[]>([]);

  // ✅ 获取listing数据
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const listingId = route.params?.listingId;
        if (!listingId) {
          Alert.alert("Error", "No listing ID provided");
          navigation.goBack();
          return;
        }

        console.log("📖 Fetching listing for editing:", listingId);
        const listingData = await listingsService.getListingById(listingId);
        
        if (listingData) {
          setListing(listingData);
          // ✅ 填充表单数据
          setDescription(listingData.description || "");
          setCategory(listingData.category || "");
          setBrand(listingData.brand || "");
          setCondition(listingData.condition || "");
          setSize(listingData.size || "");
          setMaterial(listingData.material || "");
          setPrice(listingData.price.toString());
          setShippingOption("Free shipping"); // 默认值
          setLocation("Singapore"); // 默认值
          setImages(listingData.images || []);
          console.log("✅ Listing loaded for editing:", listingData.title);
        } else {
          Alert.alert("Error", "Listing not found");
          navigation.goBack();
        }
      } catch (error) {
        console.error("❌ Error fetching listing:", error);
        Alert.alert("Error", "Failed to load listing");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [route.params?.listingId, navigation]);

  // ✅ 保存更改
  const handleSave = async () => {
    if (!listing) return;

    try {
      setSaving(true);
      console.log("📝 Saving listing changes:", listing.id);

      const updateData = {
        title: listing.title, // 保持原标题
        description: description.trim(),
        price: parseFloat(price),
        brand: brand.trim(),
        size: size.trim(),
        condition: condition,
        material: material.trim(),
        category: category,
        images: images,
        shippingOption: shippingOption,
        location: location.trim(),
      };

      const updatedListing = await listingsService.updateListing(listing.id, updateData);
      console.log("✅ Listing updated successfully:", updatedListing.id);

      Alert.alert("Success", "Listing updated successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error("❌ Error updating listing:", error);
      Alert.alert("Error", "Failed to update listing. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Picker visibility
  const [showCat, setShowCat] = useState(false);
  const [showCond, setShowCond] = useState(false);
  const [showSize, setShowSize] = useState(false);
  const [showMat, setShowMat] = useState(false);
  const [showShip, setShowShip] = useState(false);

  const handleDelete = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // ✅ 添加图片上传功能
  const handleAddImage = async () => {
    try {
      // 检查是否已达到最大图片数量
      if (images.length >= 9) {
        Alert.alert("Maximum Images", "You can only upload up to 9 images.");
        return;
      }

      // 请求相册权限
      const mediaPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (mediaPerm.status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please enable photo library permissions in your device settings to select photos.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => {
              console.log("User should manually open Settings");
            }}
          ]
        );
        return;
      }

      // 打开图片选择器
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: true, // 允许选择多张图片
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        
        // 检查添加新图片后是否超过9张
        if (images.length + newImages.length > 9) {
          Alert.alert("Too Many Images", `You can only upload up to 9 images total. You currently have ${images.length} images.`);
          return;
        }

        setImages([...images, ...newImages]);
        console.log("📸 Added images:", newImages);
      }
    } catch (error) {
      console.error("Error adding images:", error);
      Alert.alert("Error", "Failed to add images. Please try again.");
    }
  };

  // ✅ 拍照功能
  const handleTakePhoto = async () => {
    try {
      // 检查是否已达到最大图片数量
      if (images.length >= 9) {
        Alert.alert("Maximum Images", "You can only upload up to 9 images.");
        return;
      }

      // 请求相机权限
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();

      if (cameraPerm.status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please enable camera permissions in your device settings to take photos.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => {
              console.log("User should manually open Settings");
            }}
          ]
        );
        return;
      }

      // 打开相机
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImage = result.assets[0].uri;
        setImages([...images, newImage]);
        console.log("📸 Took photo:", newImage);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  // ✅ 显示图片选择选项
  const showImageOptions = () => {
    Alert.alert(
      "Add Photos",
      "Choose how you'd like to add photos",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Photo Library", onPress: handleAddImage },
        { text: "Camera", onPress: handleTakePhoto },
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <Header title="Edit Listing" showBack />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <Header title="Edit Listing" showBack />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Listing not found</Text>
        </View>
      </View>
    );
  }

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
            images.length < 9 ? (
              <TouchableOpacity style={styles.addPhotoBox} onPress={showImageOptions}>
                <Icon name="add" size={26} color="#999" />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            ) : null
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
          <TouchableOpacity 
            style={[styles.postBtn, saving && styles.postBtnDisabled]} 
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.postText}>
              {saving ? "Saving..." : "Save Changes"}
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
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
  addPhotoText: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
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
  postBtnDisabled: {
    backgroundColor: "#666",
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
