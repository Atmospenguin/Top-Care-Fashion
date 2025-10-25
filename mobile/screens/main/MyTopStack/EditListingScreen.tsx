import React, { useState, useEffect, useRef } from "react";
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
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import type { TextInput as RNTextInput } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import Icon from "../../../components/Icon";
import Header from "../../../components/Header";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { MyTopStackParamList } from "./index";
import { listingsService } from "../../../src/services/listingsService";
import type { ListingItem } from "../../../types/shop";

/** --- Options --- */
const CATEGORY_OPTIONS = ["Accessories", "Bottoms", "Footwear", "Outerwear", "Tops"];
const BRAND_OPTIONS = ["Nike", "Adidas", "Converse", "New Balance", "Zara", "Uniqlo", "H&M", "Puma", "Levi's", "Others"];
const CONDITION_OPTIONS = ["Brand New", "Like new", "Good", "Fair", "Poor"];
const SIZE_OPTIONS_CLOTHES = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
  "Free Size",
  "Other",
];
const SIZE_OPTIONS_SHOES = [
  "35",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
  "Other",
];
const SIZE_OPTIONS_ACCESSORIES = [
  "One Size",
  "Small",
  "Medium",
  "Large",
];
const MATERIAL_OPTIONS = [
  "Cotton",
  "Polyester",
  "Denim",
  "Leather",
  "Faux Leather",
  "Wool",
  "Silk",
  "Linen",
  "Nylon",
  "Spandex / Elastane",
  "Canvas",
  "Suede",
  "Velvet",
  "Acrylic",
  "Cashmere",
  "Rayon / Viscose",
  "Other",
];
const SHIPPING_OPTIONS = [
  "Free shipping", 
  "Buyer pays – $3 (within 10km)", 
  "Buyer pays – $5 (island-wide)", 
  "Buyer pays – fixed fee", 
  "Meet-up"
];
const GENDER_OPTIONS = ["Men", "Women", "Unisex"];
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

const PHOTO_LIMIT = 9;

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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Select");
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("Select");
  const [size, setSize] = useState("Select");
  const [customSize, setCustomSize] = useState("");
  const [material, setMaterial] = useState("Select");
  const [customMaterial, setCustomMaterial] = useState("");
  const [price, setPrice] = useState("");
  const [shippingOption, setShippingOption] = useState("Select");
  const [shippingFee, setShippingFee] = useState("");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [gender, setGender] = useState("Select");
  const [tags, setTags] = useState<string[]>([]);
  const customSizeInputRef = useRef<RNTextInput | null>(null);
  const customMaterialInputRef = useRef<RNTextInput | null>(null);
  const brandCustomInputRef = useRef<RNTextInput | null>(null);
  const shouldFocusSizeInput = useRef(false);
  const shouldFocusMaterialInput = useRef(false);
  const shouldFocusBrandInput = useRef(false);
  const [brandCustom, setBrandCustom] = useState("");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const scrollViewRef = useRef<RNScrollView>(null);

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
          setTitle(listingData.title || "");
          setDescription(listingData.description || "");
          setCategory(listingData.category || "Select");
          setBrand(listingData.brand || "");
          setCondition(listingData.condition || "Select");

          const incomingSize = listingData.size?.trim() ?? "";
          if (incomingSize && !SIZE_OPTIONS_CLOTHES.includes(incomingSize)) {
            setSize("Other");
            setCustomSize(incomingSize);
          } else if (incomingSize) {
            setSize(incomingSize);
            setCustomSize("");
          } else {
            setSize("Select");
            setCustomSize("");
          }

          const incomingMaterial = listingData.material?.trim() ?? "";
          if (incomingMaterial && !MATERIAL_OPTIONS.includes(incomingMaterial)) {
            setMaterial("Other");
            setCustomMaterial(incomingMaterial);
          } else if (incomingMaterial) {
            setMaterial(incomingMaterial);
            setCustomMaterial("");
          } else {
            setMaterial("Select");
            setCustomMaterial("");
          }

          setPrice(listingData.price != null ? listingData.price.toString() : "");
          const normalizedGender = listingData.gender ? listingData.gender.toLowerCase() : "";
          const matchedGender = GENDER_OPTIONS.find(
            (opt) => opt.toLowerCase() === normalizedGender
          );
          setGender(matchedGender || "Unisex");
          setShippingOption(listingData.shippingOption || "Select");
          setShippingFee(listingData.shippingFee ? listingData.shippingFee.toString() : "");
          setLocation(listingData.location || "");
          setImages(listingData.images || []);
          setTags(listingData.tags || []);
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

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert("Missing Information", "Please add a title");
      return;
    }

    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      Alert.alert("Missing Information", "Please add a description");
      return;
    }

    if (!category || category === "Select") {
      Alert.alert("Missing Information", "Please select a category");
      return;
    }

    if (!condition || condition === "Select") {
      Alert.alert("Missing Information", "Please select a condition");
      return;
    }

    if (!price.trim()) {
      Alert.alert("Missing Information", "Please enter a price");
      return;
    }

    const parsedPrice = parseFloat(price);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price");
      return;
    }

    if (!shippingOption || shippingOption === "Select") {
      Alert.alert("Missing Information", "Please select a shipping option");
      return;
    }

    let resolvedSize = "N/A";
    if (size === "Other") {
      const trimmedCustomSize = customSize.trim();
      if (!trimmedCustomSize) {
        Alert.alert("Missing Information", "Please enter a custom size");
        return;
      }
      resolvedSize = trimmedCustomSize;
    } else if (size && size !== "Select") {
      resolvedSize = size;
    }

    let resolvedMaterial = "Polyester";
    if (material === "Other") {
      const trimmedCustomMaterial = customMaterial.trim();
      if (!trimmedCustomMaterial) {
        Alert.alert("Missing Information", "Please enter a custom material");
        return;
      }
      resolvedMaterial = trimmedCustomMaterial;
    } else if (material && material !== "Select") {
      resolvedMaterial = material;
    }

    const trimmedBrand = brand.trim();
    const resolvedGender = gender && gender !== "Select" ? gender.toLowerCase() : "unisex";

    let resolvedShippingFee: number | undefined;
    if (shippingOption === "Buyer pays – fixed fee") {
      if (!shippingFee.trim()) {
        Alert.alert("Missing Information", "Please enter a shipping fee");
        return;
      }
      resolvedShippingFee = parseFloat(shippingFee);
      if (Number.isNaN(resolvedShippingFee) || resolvedShippingFee < 0) {
        Alert.alert("Invalid Shipping Fee", "Please enter a valid shipping fee");
        return;
      }
    } else if (shippingFee.trim()) {
      const parsedFee = parseFloat(shippingFee);
      if (!Number.isNaN(parsedFee)) {
        resolvedShippingFee = parsedFee;
      }
    }

    const trimmedLocation = location.trim();
    if (shippingOption === "Meet-up" && !trimmedLocation) {
      Alert.alert("Missing Information", "Please enter a meet-up location");
      return;
    }

    const updateData = {
      title: trimmedTitle,
      description: trimmedDescription,
      price: parsedPrice,
      brand: trimmedBrand,
      size: resolvedSize,
      condition,
      material: resolvedMaterial,
      category,
      gender: resolvedGender,
      images,
      tags,
      shippingOption,
      shippingFee: resolvedShippingFee,
      location: shippingOption === "Meet-up" ? trimmedLocation : undefined,
    };

    try {
      setSaving(true);
      console.log("📝 Saving listing changes:", listing.id);

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
  const [showGender, setShowGender] = useState(false);
  const [showBrand, setShowBrand] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);

  useEffect(() => {
    if (!showSize && size === "Other" && shouldFocusSizeInput.current) {
      shouldFocusSizeInput.current = false;
      const timer = setTimeout(() => {
        customSizeInputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [showSize, size]);

  useEffect(() => {
    if (!showMat && material === "Other" && shouldFocusMaterialInput.current) {
      shouldFocusMaterialInput.current = false;
      const timer = setTimeout(() => {
        customMaterialInputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [showMat, material]);

  useEffect(() => {
    if (brand === "Others" && shouldFocusBrandInput.current) {
      shouldFocusBrandInput.current = false;
      const timer = setTimeout(() => {
        brandCustomInputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [brand]);

  const handleDelete = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectBrand = (selected: string) => {
    setBrand(selected);
    if (selected === "Others") {
      shouldFocusBrandInput.current = true;
    } else {
      shouldFocusBrandInput.current = false;
      setBrandCustom("");
    }
  };

  // ✅ 添加图片上传功能
  const handleAddImage = async () => {
    try {
      if (images.length >= PHOTO_LIMIT) {
        Alert.alert("Maximum Images", `You can only upload up to ${PHOTO_LIMIT} images.`);
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
        const remainingSlots = PHOTO_LIMIT - images.length;
        if (remainingSlots <= 0) {
          Alert.alert("Maximum Images", `You can only upload up to ${PHOTO_LIMIT} images.`);
          return;
        }

        const assetsToAdd = result.assets.slice(0, remainingSlots);
        const newImages = assetsToAdd.map((asset) => asset.uri);
        setImages((prev) => [...prev, ...newImages]);
        console.log("📸 Added images:", newImages);

        if (result.assets.length > assetsToAdd.length) {
          Alert.alert(
            "Too Many Images",
            `Only ${PHOTO_LIMIT} photos are allowed. ${result.assets.length - assetsToAdd.length} image(s) were not added.`
          );
        }
      }
    } catch (error) {
      console.error("Error adding images:", error);
      Alert.alert("Error", "Failed to add images. Please try again.");
    }
  };

  // ✅ 拍照功能
  const handleTakePhoto = async () => {
    try {
      if (images.length >= PHOTO_LIMIT) {
        Alert.alert("Maximum Images", `You can only upload up to ${PHOTO_LIMIT} images.`);
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
        setImages((prev) => [...prev, newImage]);
        console.log("📸 Took photo:", newImage);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  // ✅ 显示图片选择选项
  const showImageOptions = () => {
    if (images.length >= PHOTO_LIMIT) {
      Alert.alert("Maximum Images", `You can only upload up to ${PHOTO_LIMIT} images.`);
      return;
    }
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

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photos */}
          <FlatList
            data={images}
            keyExtractor={(_, i) => i.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.photoItem}
                onPress={() => setPreviewIndex(index)}
              >
                <Image source={{ uri: item }} style={styles.photoImage} />
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(index);
                  }}
                >
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            ListFooterComponent={
              images.length < PHOTO_LIMIT ? (
                <TouchableOpacity style={styles.addPhotoBox} onPress={showImageOptions}>
                  <Icon name="add" size={26} color="#999" />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </TouchableOpacity>
              ) : null
            }
            style={{ marginBottom: 16 }}
          />

          {/* === 必填字段区域 === */}

          {/* Title - 必填 */}
          <Text style={styles.sectionTitle}>Title <Text style={styles.requiredMark}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter a catchy title for your item"
            maxLength={60}
          />
          <Text style={styles.charCount}>{title.length}/60</Text>

          {/* Description - 必填 */}
          <Text style={styles.sectionTitle}>Description <Text style={styles.requiredMark}>*</Text></Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: "top" }]}
            multiline
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your item in detail..."
            maxLength={500}
          />
          <Text style={styles.charCount}>{description.length}/500</Text>

          {/* Category - 必填 */}
          <Text style={styles.sectionTitle}>Category <Text style={styles.requiredMark}>*</Text></Text>
          <TouchableOpacity style={styles.selectBtn} onPress={() => setShowCat(true)}>
            <Text style={styles.selectValue}>
              {category && category !== "Select" ? category : "Select"}
            </Text>
          </TouchableOpacity>

          {/* Price - 必填 */}
          <Text style={styles.sectionTitle}>Price <Text style={styles.requiredMark}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder="Enter price (e.g. 25.00)"
          />

          {/* Shipping - 必填 */}
          <Text style={styles.sectionTitle}>Shipping <Text style={styles.requiredMark}>*</Text></Text>
          <TouchableOpacity style={styles.selectBtn} onPress={() => setShowShip(true)}>
            <Text style={styles.selectValue}>
              {shippingOption && shippingOption !== "Select" ? shippingOption : "Select"}
            </Text>
          </TouchableOpacity>

          {shippingOption === "Buyer pays – fixed fee" && (
            <TextInput
              style={styles.input}
              placeholder="Enter custom fee (e.g. $3.00)"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={shippingFee}
              onChangeText={setShippingFee}
            />
          )}

          {shippingOption === "Meet-up" && (
            <>
              <Text style={styles.fieldLabel}>Meet-up Location</Text>
              <TextInput
                style={styles.input}
                placeholder="eg. Bugis MRT Station, Singapore"
                placeholderTextColor="#999"
                value={location}
                onChangeText={setLocation}
              />
            </>
          )}

          {/* === 可选字段区域 === */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Additional Details (Optional)</Text>

          <Text style={styles.fieldLabel}>Brand</Text>
          <TouchableOpacity style={styles.selectBtn} onPress={() => setShowBrand(true)}>
            <Text style={styles.selectValue}>
              {brand === "Others"
                ? brandCustom || "Enter brand"
                : brand !== "Select"
                ? brand
                : "Select"}
            </Text>
          </TouchableOpacity>
          {brand === "Others" && (
            <TextInput
              ref={brandCustomInputRef}
              style={styles.input}
              placeholder="Enter brand (eg. Nike, Zara)"
              value={brandCustom}
              onChangeText={setBrandCustom}
            />
          )}

          <Text style={styles.fieldLabel}>Condition</Text>
          <TouchableOpacity style={styles.selectBtn} onPress={() => setShowCond(true)}>
            <Text style={styles.selectValue}>
              {condition && condition !== "Select" ? condition : "Select"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.fieldLabel}>Size</Text>
          <TouchableOpacity style={styles.selectBtn} onPress={() => setShowSize(true)}>
            <Text style={styles.selectValue}>
              {size === "Other"
                ? customSize || "Enter custom size"
                : size && size !== "Select"
                ? size
                : "Select"}
            </Text>
          </TouchableOpacity>
          {size === "Other" && (
            <TextInput
              ref={customSizeInputRef}
              style={styles.input}
              placeholder="Enter custom size"
              placeholderTextColor="#999"
              value={customSize}
              onChangeText={setCustomSize}
              returnKeyType="done"
            />
          )}

          <Text style={styles.fieldLabel}>Material</Text>
          <TouchableOpacity style={styles.selectBtn} onPress={() => setShowMat(true)}>
            <Text style={styles.selectValue}>
              {material === "Other"
                ? customMaterial || "Enter custom material"
                : material && material !== "Select"
                ? material
                : "Select"}
            </Text>
          </TouchableOpacity>
          {material === "Other" && (
            <TextInput
              ref={customMaterialInputRef}
              style={styles.input}
              placeholder="Enter custom material"
              placeholderTextColor="#999"
              value={customMaterial}
              onChangeText={setCustomMaterial}
              returnKeyType="done"
            />
          )}

          <Text style={styles.fieldLabel}>Gender</Text>
          <TouchableOpacity style={styles.selectBtn} onPress={() => setShowGender(true)}>
            <Text style={styles.selectValue}>
              {gender && gender !== "Select" ? gender : "Select"}
            </Text>
          </TouchableOpacity>

          {/* Tags Section */}
          <Text style={styles.fieldLabel}>Tags</Text>
          <Text style={{ color: "#555", marginBottom: 6, fontSize: 13 }}>
            Add up to 5 tags to help buyers find your item
          </Text>
          {tags.length === 0 ? (
            <TouchableOpacity style={styles.addStyleBtn} onPress={() => setShowTagPicker(true)}>
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
      </KeyboardAvoidingView>

      {/* Image Preview Modal - 支持滑动切换 */}
      <Modal
        visible={previewIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewIndex(null)}
      >
        <View style={styles.previewModalOverlay}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: (previewIndex ?? 0) * Dimensions.get("window").width, y: 0 }}
            style={styles.previewScrollView}
          >
            {images.map((image) => (
              <View key={image} style={styles.previewImageContainer}>
                <Image
                  source={{ uri: image }}
                  style={styles.previewModalImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>

          {/* 顶部工具栏 */}
          <View style={styles.previewTopBar}>
            <View style={styles.previewIndicator}>
              <Text style={styles.previewIndicatorText}>
                {(previewIndex ?? 0) + 1} / {images.length}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.previewCloseBtn}
              onPress={() => setPreviewIndex(null)}
            >
              <Icon name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* 底部缩略图导航 */}
          {images.length > 1 && (
            <View style={styles.previewBottomBar}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnailContainer}
              >
                {images.map((image, index) => (
                  <TouchableOpacity
                    key={image}
                    style={[
                      styles.thumbnail,
                      index === previewIndex && styles.thumbnailActive,
                    ]}
                    onPress={() => {
                      setPreviewIndex(index);
                      scrollViewRef.current?.scrollTo({
                        x: index * Dimensions.get("window").width,
                        animated: true,
                      });
                    }}
                  >
                    <Image
                      source={{ uri: image }}
                      style={styles.thumbnailImage}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

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
        options={
          category === "Footwear"
            ? SIZE_OPTIONS_SHOES
            : category === "Accessories"
            ? SIZE_OPTIONS_ACCESSORIES
            : SIZE_OPTIONS_CLOTHES
        }
        value={size}
        onClose={() => setShowSize(false)}
        onSelect={(value) => {
          setSize(value);
          if (value === "Other") {
            shouldFocusSizeInput.current = true;
          } else {
            setCustomSize("");
          }
        }}
      />
      <OptionPicker
        title="Select material"
        visible={showMat}
        options={MATERIAL_OPTIONS}
        value={material}
        onClose={() => setShowMat(false)}
        onSelect={(value) => {
          setMaterial(value);
          if (value === "Other") {
            shouldFocusMaterialInput.current = true;
          } else {
            setCustomMaterial("");
          }
        }}
      />
      <OptionPicker
        title="Select shipping option"
        visible={showShip}
        options={SHIPPING_OPTIONS}
        value={shippingOption}
        onClose={() => setShowShip(false)}
        onSelect={(value) => {
          setShippingOption(value);
          if (value !== "Buyer pays – fixed fee") {
            setShippingFee("");
          }
          if (value !== "Meet-up") {
            setLocation("");
          }
        }}
      />
      <OptionPicker
        title="Select gender"
        visible={showGender}
        options={GENDER_OPTIONS}
        value={gender}
        onClose={() => setShowGender(false)}
        onSelect={setGender}
      />
      <OptionPicker
        title="Select brand"
        visible={showBrand}
        options={BRAND_OPTIONS}
        value={brand}
        onClose={() => setShowBrand(false)}
        onSelect={handleSelectBrand}
      />
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
  requiredMark: { color: "#F54B3D", fontWeight: "700" },
  fieldLabel: { fontSize: 14, fontWeight: "500", color: "#333", marginBottom: 6, marginTop: 8 },
  charCount: { 
    fontSize: 12, 
    color: "#999", 
    textAlign: "right", 
    marginTop: -8, 
    marginBottom: 8 
  },
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

  // Tags
  addStyleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F54B3D",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  addStyleText: {
    color: "#F54B3D",
    fontWeight: "600",
    marginLeft: 6,
  },
  selectedTagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    backgroundColor: "#F54B3D",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tagChipText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  addStyleBtnSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F54B3D",
    alignItems: "center",
    justifyContent: "center",
  },

  // Tag Picker Modal
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

  // Image Preview Modal
  previewModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
  },
  previewScrollView: {
    flex: 1,
  },
  previewImageContainer: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
    justifyContent: "center",
    alignItems: "center",
  },
  previewModalImage: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.8,
  },
  previewTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  previewIndicator: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  previewIndicatorText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  previewCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  thumbnailContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  thumbnail: {
    width: 60,
    height: 75,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbnailActive: {
    borderColor: "#fff",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  // clearTiny removed (legacy back link)
});
