import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Alert,
  type AlertButton,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import type { TextInput as RNTextInput } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
// note: keep Header's SafeAreaView; remove outer SafeAreaView to avoid double padding
import Icon from "../../../components/Icon";
import Header from "../../../components/Header"; 
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import type { SellStackParamList } from "./SellStackNavigator";
import { listingsService, type CreateListingRequest } from "../../../src/services/listingsService";
import { benefitsService, type UserBenefitsPayload } from "../../../src/services";
import { ApiError } from "../../../src/config/api";
import { useAuth } from "../../../contexts/AuthContext";
/** --- Options --- */
const CATEGORY_OPTIONS = ["Accessories", "Bottoms", "Footwear", "Outerwear", "Tops"];
const BRAND_OPTIONS = ["Nike", "Adidas", "Converse", "New Balance", "Zara", "Uniqlo", "H&M", "Puma", "Levi's", "Others"];
const CONDITION_OPTIONS = ["Brand New", "Like new", "Good", "Fair", "Poor"];
const GENDER_OPTIONS = ["Men", "Women", "Unisex"];
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

/** --- Bottom Sheet Picker --- */
type OptionPickerProps = {
  title: string;
  visible: boolean;
  options: string[];
  value: string;
  onClose: () => void;
  onSelect: (value: string) => void;
};

type PhotoItem = {
  id: string;
  localUri: string;
  remoteUrl?: string;
  uploading: boolean;
  error?: string;
};

function OptionPicker({
  title,
  visible,
  options,
  value,
  onClose,
  onSelect,
}: OptionPickerProps) {
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
  const { user } = useAuth();
  const [benefits, setBenefits] = useState<UserBenefitsPayload["benefits"] | null>(null);
  const [loadingBenefits, setLoadingBenefits] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiDesc, setAiDesc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Gender
  const [gender, setGender] = useState("Select");
  
  // Info
  const [category, setCategory] = useState("Select");
  const [condition, setCondition] = useState("Select");
  const [size, setSize] = useState("Select");
  
  // Image preview - 支持多图预览
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const scrollViewRef = useRef<RNScrollView>(null);
  const [customSize, setCustomSize] = useState("");
  const [material, setMaterial] = useState("Select");
  const [customMaterial, setCustomMaterial] = useState("");
  const [brand, setBrand] = useState("Select");
  const [brandCustom, setBrandCustom] = useState("");
  const [price, setPrice] = useState("");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const customSizeInputRef = useRef<RNTextInput | null>(null);
  const customMaterialInputRef = useRef<RNTextInput | null>(null);
  const brandCustomInputRef = useRef<RNTextInput | null>(null);
  const shouldFocusSizeInput = useRef(false);
  const shouldFocusMaterialInput = useRef(false);
  const shouldFocusBrandInput = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const loadBenefits = async () => {
        if (!user) {
          if (mounted) {
            setBenefits(null);
          }
          return;
        }

        try {
          setLoadingBenefits(true);
          const payload = await benefitsService.getUserBenefits();
          if (!mounted) return;
          setBenefits(payload.benefits);
        } catch (err) {
          console.warn("Failed to load benefits for sell screen", err);
          if (mounted) {
            setBenefits(null);
          }
        } finally {
          if (mounted) {
            setLoadingBenefits(false);
          }
        }
      };

      loadBenefits();
      return () => {
        mounted = false;
      };
    }, [user])
  );

  const listingLimitReached = benefits ? !benefits.canCreateListing : false;
  const listingQuotaText = benefits
    ? benefits.listingLimit === null
      ? `Active listings: ${benefits.activeListingsCount} (Unlimited)`
      : `Active listings: ${benefits.activeListingsCount}/${benefits.listingLimit}`
    : null;

  // Shipping
  const [shippingOption, setShippingOption] = useState("Select");
  const [shippingFee, setShippingFee] = useState("");
  const [location, setLocation] = useState("");

  // Pickers
  const [showGender, setShowGender] = useState(false);
  const [showCat, setShowCat] = useState(false);
  const [showCond, setShowCond] = useState(false);
  const [showSize, setShowSize] = useState(false);
  const [showMaterial, setShowMaterial] = useState(false);
  const [showBrand, setShowBrand] = useState(false);
  const [showShip, setShowShip] = useState(false);

  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

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
    if (!showMaterial && material === "Other" && shouldFocusMaterialInput.current) {
      shouldFocusMaterialInput.current = false;
      const timer = setTimeout(() => {
        customMaterialInputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [showMaterial, material]);

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

  const ensureMediaPermissions = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow photo library access to upload images.");
      return false;
    }
    return true;
  };

  const ensureCameraPermissions = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow camera access to take photos.");
      return false;
    }
    return true;
  };

  const processSelectedAssets = async (assets: ImagePicker.ImagePickerAsset[]) => {
    if (!assets.length) {
      return;
    }

    const availableSlots = Math.max(PHOTO_LIMIT - photos.length, 0);
    if (availableSlots <= 0) {
      Alert.alert("Limit reached", `You can upload up to ${PHOTO_LIMIT} photos per listing.`);
      return;
    }

    const assetsToUse = assets.slice(0, availableSlots);
    if (assets.length > assetsToUse.length) {
      Alert.alert(
        "Limit reached",
        `Only ${PHOTO_LIMIT} photos are allowed. ${assets.length - assetsToUse.length} image(s) were not added.`
      );
    }

    for (const asset of assetsToUse) {
      try {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          asset.uri,
          [],
          {
            compress: 0.85,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        const tempId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        setPhotos((prev) => [
          ...prev,
          {
            id: tempId,
            localUri: manipulatedImage.uri,
            uploading: true,
          },
        ]);

        try {
          const remoteUrl = await listingsService.uploadListingImage(manipulatedImage.uri);
          setPhotos((prev) =>
            prev.map((photo) =>
              photo.id === tempId
                ? {
                    ...photo,
                    remoteUrl,
                    uploading: false,
                  }
                : photo
            )
          );
        } catch (error) {
          console.error("Photo upload failed:", error);
          setPhotos((prev) => prev.filter((photo) => photo.id !== tempId));
          Alert.alert("Upload failed", "We couldn't upload that photo. Please try again.");
        }
      } catch (error) {
        console.error("Image processing failed:", error);
        Alert.alert("Error", "We couldn't process that photo. Please try again.");
      }
    }
  };

  const handlePickFromLibrary = async () => {
    if (photos.length >= PHOTO_LIMIT) {
      Alert.alert("Limit reached", `You can upload up to ${PHOTO_LIMIT} photos per listing.`);
      return;
    }

    const allowed = await ensureMediaPermissions();
    if (!allowed) return;

    const availableSlots = Math.max(PHOTO_LIMIT - photos.length, 1);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        allowsMultipleSelection: true,
        quality: 0.85,
        selectionLimit: availableSlots,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      await processSelectedAssets(result.assets);
    } catch (error) {
      if (error && typeof error === "object" && "message" in error) {
        console.log("Image picker error:", (error as Error).message);
      }
    }
  };

  const handleCapturePhoto = async () => {
    if (photos.length >= PHOTO_LIMIT) {
      Alert.alert("Limit reached", `You can upload up to ${PHOTO_LIMIT} photos per listing.`);
      return;
    }

    const allowed = await ensureCameraPermissions();
    if (!allowed) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      await processSelectedAssets([result.assets[0]]);
    } catch (error) {
      if (error && typeof error === "object" && "message" in error) {
        console.log("Camera error:", (error as Error).message);
      }
    }
  };

  const handleAddPhoto = () => {
    if (photos.length >= PHOTO_LIMIT) {
      Alert.alert("Limit reached", `You can upload up to ${PHOTO_LIMIT} photos per listing.`);
      return;
    }

    Alert.alert(
      "Add Photos",
      "Choose how you'd like to add photos",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Photo Library", onPress: handlePickFromLibrary },
        { text: "Camera", onPress: handleCapturePhoto },
      ]
    );
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
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

  // 保存 listing
  const handlePostListing = async () => {
    if (listingLimitReached) {
      const listingLimit = benefits?.listingLimit;
      const alertMessage = listingLimit === null
        ? "You currently cannot post new listings."
        : listingLimit === undefined
        ? "You have reached the active listing limit for your plan. Remove an active listing or upgrade to Premium for unlimited listings."
        : `You have reached the ${listingLimit} active listing limit for your plan. Remove an active listing or upgrade to Premium for unlimited listings.`;

      const alertButtons: AlertButton[] | undefined = listingLimit === null
        ? undefined
        : [
            { text: "Cancel", style: "cancel" },
            {
              text: "Upgrade",
              style: "default",
              onPress: () =>
                (navigation as any)?.getParent()?.getParent()?.navigate("Premium", {
                  screen: "PremiumPlans",
                }),
            },
          ];

      Alert.alert("Listing limit reached", alertMessage, alertButtons);
      return;
    }
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

    if (category === "Select") {
      Alert.alert("Missing Information", "Please select a category");
      return;
    }

    if (condition === "Select") {
      Alert.alert("Missing Information", "Please select a condition");
      return;
    }

    const priceInput = price.trim();
    if (!priceInput) {
      Alert.alert("Missing Information", "Please enter a price");
      return;
    }

    const priceValue = parseFloat(priceInput);
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price");
      return;
    }

    if (shippingOption === "Select") {
      Alert.alert("Missing Information", "Please select a shipping option");
      return;
    }

    const customSizeValue = customSize.trim();
    if (size === "Other" && !customSizeValue) {
      Alert.alert("Missing Information", "Please enter a custom size");
      customSizeInputRef.current?.focus();
      return;
    }

    const customMaterialValue = customMaterial.trim();
    if (material === "Other" && !customMaterialValue) {
      Alert.alert("Missing Information", "Please enter a custom material");
      customMaterialInputRef.current?.focus();
      return;
    }

    const customBrandValue = brandCustom.trim();
    if (brand === "Others" && !customBrandValue) {
      Alert.alert("Missing Information", "Please enter a brand");
      brandCustomInputRef.current?.focus();
      return;
    }

    const shippingFeeInput = shippingFee.trim();
    let resolvedShippingFee: number | undefined;
    if (shippingOption === "Buyer pays – fixed fee") {
      if (!shippingFeeInput) {
        Alert.alert("Missing Information", "Please enter a shipping fee");
        return;
      }
      const parsedFee = parseFloat(shippingFeeInput);
      if (Number.isNaN(parsedFee) || parsedFee < 0) {
        Alert.alert("Invalid Shipping Fee", "Please enter a valid shipping fee");
        return;
      }
      resolvedShippingFee = parsedFee;
    } else if (shippingFeeInput) {
      const parsedFee = parseFloat(shippingFeeInput);
      if (!Number.isNaN(parsedFee)) {
        resolvedShippingFee = parsedFee;
      }
    }

    const trimmedLocation = location.trim();
    if (shippingOption === "Meet-up" && !trimmedLocation) {
      Alert.alert("Missing Information", "Please enter a meet-up location");
      return;
    }

    if (photos.some((photo) => photo.uploading)) {
      Alert.alert("Uploading", "Please wait for all photos to finish uploading before posting.");
      return;
    }

    const uploadedImages = photos
      .filter((photo) => !!photo.remoteUrl)
      .map((photo) => photo.remoteUrl!)
      .slice(0, PHOTO_LIMIT);

    const resolvedSize = size === "Other" ? customSizeValue : size !== "Select" ? size : "N/A";
    const resolvedMaterial =
      material === "Other"
        ? customMaterialValue
        : material !== "Select"
        ? material
        : "Polyester";
    const resolvedBrand =
      brand !== "Select" ? (brand === "Others" ? customBrandValue : brand) : "";
    const resolvedGender = gender !== "Select" ? gender.toLowerCase() : "unisex";

    setSaving(true);
    try {
      // derive a numeric shipping fee for preset options (prefer preset over user-entered resolved value)
      let calculatedShippingFee: number | undefined;
      try {
        if (typeof shippingOption === "string" && shippingOption.includes("$3")) {
          calculatedShippingFee = 3;
        } else if (typeof shippingOption === "string" && shippingOption.includes("$5")) {
          calculatedShippingFee = 5;
        } else if (shippingOption === "Buyer pays – fixed fee" && shippingFee) {
          const parsed = parseFloat(shippingFee);
          if (!Number.isNaN(parsed)) calculatedShippingFee = parsed;
        } else if (shippingOption === "Free shipping" || shippingOption === "Meet-up") {
          calculatedShippingFee = 0;
        }
      } catch (e) {
        console.warn("Failed to calculate preset shipping fee", e);
      }

      const listingData: CreateListingRequest = {
        title: trimmedTitle,
        description: trimmedDescription,
        price: priceValue,
        brand: resolvedBrand,
        size: resolvedSize,
        condition: condition !== "Select" ? condition : "Good",
        material: resolvedMaterial,
        tags,
        category,
        gender: resolvedGender,
        images: uploadedImages,
        shippingOption,
        // prefer calculated preset fee when available, otherwise use the resolvedShippingFee (user-entered or parsed)
        shippingFee: calculatedShippingFee !== undefined ? calculatedShippingFee : resolvedShippingFee,
        location: shippingOption === "Meet-up" ? trimmedLocation : undefined,
      };

      const createdListing = await listingsService.createListing(listingData);
      
      Alert.alert(
        "Success!",
        "Your listing has been posted successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              // 重置表单
              setTitle("");
              setDescription("");
              setGender("Select");
              setCategory("Select");
              setCondition("Select");
              setSize("Select");
              setCustomSize("");
              setMaterial("Select");
              setCustomMaterial("");
              setBrand("Select");
              setBrandCustom("");
              // brand two-line mode: no toggle state to reset
              setPrice("");
              setPhotos([]);
              setTags([]);
              setShippingOption("Select");
              setShippingFee("");
              setLocation("");
              // 导航到用户主页或 Discover
              const parentNav = navigation.getParent();
              (parentNav as any)?.navigate("My TOP", { screen: "ActiveListings" });
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error posting listing:", error);
      Alert.alert("Error", "Failed to post listing. Please try again.");
    } finally {
      setSaving(false);
    }
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

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={{ paddingBottom: 20 }} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 图片上传 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photoRow}
          >
            {photos.length < PHOTO_LIMIT && (
              <TouchableOpacity style={styles.photoBox} onPress={handleAddPhoto}>
                <Icon name="add" size={24} color="#999" />
                <Text style={styles.photoAddHint}>Add photo</Text>
              </TouchableOpacity>
            )}

            {photos.map((photo, index) => (
              <TouchableOpacity 
                key={photo.id} 
                style={styles.photoPreview}
                onPress={() => setPreviewIndex(index)}
              >
                <Image source={{ uri: photo.localUri }} style={styles.photoPreviewImage} />
                {photo.uploading ? (
                  <View style={styles.photoUploadingOverlay}>
                    <ActivityIndicator color="#fff" />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.photoRemoveBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRemovePhoto(photo.id);
                    }}
                  >
                    <Icon name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity onPress={() => setShowGuide(true)}>
            <Text style={styles.photoTips}>Read our photo tips</Text>
          </TouchableOpacity>

          {/* === 必填字段区域 === */}
          
          {/* 标题 - 必填 */}
          <Text style={styles.sectionTitle}>Title <Text style={styles.requiredMark}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter a catchy title for your item"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
            maxLength={60}
          />
          <Text style={styles.charCount}>{title.length}/60</Text>

          {/* 描述 - 必填 */}
          <Text style={styles.sectionTitle}>Description <Text style={styles.requiredMark}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="eg. small grey Nike t-shirt, only worn a few times"
            placeholderTextColor="#999"
            multiline
            value={description}
            onChangeText={setDescription}
            maxLength={500}
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
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

          {/* Category - 必填 */}
          <Text style={styles.sectionTitle}>Category <Text style={styles.requiredMark}>*</Text></Text>
          <TouchableOpacity style={styles.selectBtn} onPress={() => setShowCat(true)}>
            <Text style={styles.selectValue}>
              {category !== "Select" ? category : "Select"}
            </Text>
          </TouchableOpacity>

          {/* Condition - 必填 */}
          <Text style={styles.sectionTitle}>Condition <Text style={styles.requiredMark}>*</Text></Text>
          <TouchableOpacity style={styles.selectBtn} onPress={() => setShowCond(true)}>
            <Text style={styles.selectValue}>
              {condition !== "Select" ? condition : "Select"}
            </Text>
          </TouchableOpacity>

          {/* Price - 必填 */}
          <Text style={styles.sectionTitle}>Price <Text style={styles.requiredMark}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter price (e.g. 25.00)"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />

          {/* Shipping - 必填 */}
          <Text style={styles.sectionTitle}>Shipping <Text style={styles.requiredMark}>*</Text></Text>
          <TouchableOpacity style={styles.selectBtn} onPress={() => setShowShip(true)}>
            <Text style={styles.selectValue}>
              {shippingOption !== "Select" ? shippingOption : "Select"}
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

          <Text style={styles.fieldLabel}>Size</Text>
          <TouchableOpacity style={styles.selectBtn} onPress={() => setShowSize(true)}>
            <Text style={styles.selectValue}>
              {size === "Other"
                ? customSize || "Enter custom size"
                : size !== "Select"
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
          <TouchableOpacity style={styles.selectBtn} onPress={() => setShowMaterial(true)}>
            <Text style={styles.selectValue}>
              {material === "Other"
                ? customMaterial || "Enter custom material"
                : material !== "Select"
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
              {gender !== "Select" ? gender : "Select"}
            </Text>
          </TouchableOpacity>

          {/* Tags Section */}
          <Text style={styles.fieldLabel}>Tags</Text>
          <Text style={{ color: "#555", marginBottom: 6, fontSize: 13 }}>
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

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.draftBtn}>
              <Text style={styles.draftText}>Save to drafts</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.postBtn, saving && styles.postBtnDisabled]} 
              onPress={handlePostListing}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.postText}>Post listing</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Pickers */}
      <OptionPicker title="Select gender" visible={showGender} options={GENDER_OPTIONS} value={gender} onClose={() => setShowGender(false)} onSelect={setGender} />
      <OptionPicker title="Select category" visible={showCat} options={CATEGORY_OPTIONS} value={category} onClose={() => setShowCat(false)} onSelect={setCategory} />
  <OptionPicker title="Select brand" visible={showBrand} options={BRAND_OPTIONS} value={brand} onClose={() => setShowBrand(false)} onSelect={handleSelectBrand} />
      <OptionPicker title="Select condition" visible={showCond} options={CONDITION_OPTIONS} value={condition} onClose={() => setShowCond(false)} onSelect={setCondition} />
      
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
            {photos.map((photo, index) => (
              <View key={photo.id} style={styles.previewImageContainer}>
                <Image 
                  source={{ uri: photo.localUri }} 
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
                {(previewIndex ?? 0) + 1} / {photos.length}
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
          {photos.length > 1 && (
            <View style={styles.previewBottomBar}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnailContainer}
              >
                {photos.map((photo, index) => (
                  <TouchableOpacity
                    key={photo.id}
                    style={[
                      styles.thumbnail,
                      index === previewIndex && styles.thumbnailActive
                    ]}
                    onPress={() => {
                      setPreviewIndex(index);
                      scrollViewRef.current?.scrollTo({
                        x: index * Dimensions.get("window").width,
                        animated: true
                      });
                    }}
                  >
                    <Image 
                      source={{ uri: photo.localUri }} 
                      style={styles.thumbnailImage}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

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
        onSelect={(val) => {
          setSize(val);
          if (val === "Other") {
            shouldFocusSizeInput.current = true;
          } else {
            setCustomSize("");
          }
        }}
      />
      <OptionPicker
        title="Select material"
        visible={showMaterial}
        options={MATERIAL_OPTIONS}
        value={material}
        onClose={() => setShowMaterial(false)}
        onSelect={(val) => {
          setMaterial(val);
          if (val === "Other") {
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
        onSelect={(val) => {
          setShippingOption(val);
          if (val !== "Buyer pays – fixed fee") {
            setShippingFee("");
          }
          if (val !== "Meet-up") {
            setLocation("");
          }
        }}
      />
      {/* Tag Picker Modal */}
      <TagPickerModal
        visible={showTagPicker}
        onClose={() => setShowTagPicker(false)}
        tags={tags}
        setTags={setTags}
      />
      {/* Photo Standards Guide Modal */}
      <Modal
        visible={showGuide}
        animationType="slide"
        transparent
        onRequestClose={() => setShowGuide(false)}
      >
        <Pressable style={styles.guideOverlay} onPress={() => setShowGuide(false)} />
        <View style={styles.guideModal}>
          <View style={styles.guideHeader}>
            <TouchableOpacity onPress={() => setShowGuide(false)}>
              <Icon name="close-outline" size={28} color="#111" />
            </TouchableOpacity>
            <Text style={styles.guideTitle}>Photo Standards Guide</Text>
            <View style={{ width: 28 }} />
          </View>
          <ScrollView contentContainerStyle={styles.guideContent}>
            <Text style={styles.guideText}>
              If your listing photos don’t meet our standards, we may ask you to resubmit before it goes live. Follow these tips to make your item stand out and get approved faster.
            </Text>

            <Text style={styles.guideSectionTitle}>1. Use Natural Light 🌤️</Text>
            <Text style={styles.guideText}>
              Shoot in daylight near a window — natural light shows true appearance. Avoid dark rooms or harsh flash that can distort your item's appearance.
            </Text>

            <Text style={styles.guideSectionTitle}>2. Keep It Clean & Simple 🧺</Text>
            <Text style={styles.guideText}>
              Use a plain, solid background (white or neutral color). Remove clutter and avoid filters or heavy edits that alter color accuracy.
            </Text>

            <Text style={styles.guideSectionTitle}>3. Show the Full Item 👕</Text>
            <Text style={styles.guideText}>
              Better include at least 4–5 photos covering all key angles:
              {"\n"}• Full view — entire item laid flat or hung
              {"\n"}• Brand tag — clear logo shot 
              {"\n"}• Details — close-up of texture or stitching
              {"\n"}• Flaws — any wear or damage
              {"\n"}• Optional — on-body shot to show fit
            </Text>

            <Text style={styles.guideSectionTitle}>4. Be Honest 💬</Text>
            <Text style={styles.guideText}>
              Only upload photos of your actual item. Do not use stock images. Make sure textures are true to life.
            </Text>

            <Text style={styles.guideSectionTitle}>5. Respect Privacy 🚫</Text>
            <Text style={styles.guideText}>
              No faces, personal info, or third-party content in your photos. Keep the focus on the product.
            </Text>

            <Text style={[styles.guideSectionTitle, { marginTop: 16 }]}>✅ Summary</Text>
            <Text style={styles.guideText}>
              Clear light, clean background, honest details. Photos should look natural, simple, and professional.
            </Text>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
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
    width: 100,
    height: 120,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
    marginRight: 12,
  },
  photoRow: {
    paddingVertical: 4,
    alignItems: "center",
  },
  photoAddHint: {
    marginTop: 8,
    fontSize: 12,
    color: "#666",
  },
  photoPreview: {
    width: 100,
    height: 120,
    borderRadius: 12,
    marginRight: 12,
    overflow: "hidden",
    backgroundColor: "#f1f1f1",
    position: "relative",
  },
  photoPreviewImage: {
    width: "100%",
    height: "100%",
  },
  photoUploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoRemoveBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoTips: { fontSize: 14, color: "#5B21B6", marginBottom: 16 },

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
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 15, backgroundColor: "#fafafa" },

  aiGenBtn: { alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: "#5B21B6", borderRadius: 20, marginBottom: 12 },
  aiBox: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: "#F3E8FF", position: "relative" },
  closeIcon: { position: "absolute", top: 8, right: 8 },
  aiActionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  useSmallBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, backgroundColor: "#5B21B6" },

  selectBtn: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 12, width: "100%" },
  selectValue: { fontSize: 15, color: "#111" },

  // clearTiny removed (was used for back link in legacy brand UI)

  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  draftBtn: { flex: 1, borderWidth: 1, borderColor: "#000", borderRadius: 25, paddingVertical: 12, alignItems: "center", marginRight: 8 },
  draftText: { fontWeight: "600", fontSize: 16 },
  postBtn: { flex: 1, backgroundColor: "#000", borderRadius: 25, paddingVertical: 12, alignItems: "center", marginLeft: 8 },
  postText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  postBtnDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },

  sheetMask: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.25)" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  sheetHandle: { alignSelf: "center", width: 44, height: 5, borderRadius: 999, backgroundColor: "#DDD", marginBottom: 8 },
  sheetTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  optionRow: { paddingVertical: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: "#eee", borderRadius: 10, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  optionText: { fontSize: 15, color: "#111" },
  sheetCancel: { marginTop: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: "#F6F6F6", alignItems: "center" },
  guideOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  guideModal: { position: "absolute", bottom: 0, left: 0, right: 0, height: "66%", backgroundColor: "#fff", borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: "hidden" },
  guideHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#ddd" },
  guideTitle: { fontSize: 17, fontWeight: "700", color: "#111" },
  guideContent: { paddingHorizontal: 20, paddingVertical: 16 },
  guideSectionTitle: { fontWeight: "700", fontSize: 15, marginTop: 14, marginBottom: 6, color: "#111" },
  guideText: { fontSize: 14, color: "#333", lineHeight: 20 },
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
});