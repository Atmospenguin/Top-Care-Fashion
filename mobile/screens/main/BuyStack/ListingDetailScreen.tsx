import React, { useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Share,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import type { BagItem } from "../../../types/shop";
import type { BuyStackParamList } from "./index";

const { width: WINDOW_WIDTH } = Dimensions.get("window");
const IMAGE_SIZE = Math.min(WINDOW_WIDTH - 48, 360);

const REPORT_CATEGORIES = [
  { id: "counterfeit", label: "Counterfeit item or other intellectual property infringement" },
  { id: "prohibited", label: "Prohibited or dangerous item" },
  { id: "inappropriate", label: "Nudity, violence or hate speech" },
  { id: "outside_payment", label: "Request to be paid outside of the TOP app" },
  { id: "unavailable", label: "Item isn't available to buy" },
  { id: "dislike", label: "I just don't like it" },
  { id: "illegal", label: "Violates a specific law or regulation" },
  { id: "other", label: "Something else" },
];

export default function ListingDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<BuyStackParamList>>();
  const {
    params: { item },
  } = useRoute<RouteProp<BuyStackParamList, "ListingDetail">>();
  const [showMenu, setShowMenu] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [reportDetails, setReportDetails] = useState("");

  const defaultBag = useMemo<BagItem[]>(
    () => [{ item, quantity: 1 }],
    [item],
  );
  const subtotal = useMemo(
    () => defaultBag.reduce((sum, current) => sum + current.item.price * current.quantity, 0),
    [defaultBag],
  );
  const shippingFee = 8;

  const handleReport = () => {
    setShowMenu(false);
    setReportModalVisible(true);
  };

  const handleSubmitReport = () => {
    if (!selectedCategory) {
      Alert.alert("Notice", "Please select a report category");
      return;
    }
    if (!reportDetails.trim()) {
      Alert.alert("Notice", "Please fill in report details");
      return;
    }
    
    // TODO: Submit report to backend
    Alert.alert(
      "Report Submitted",
      "Thank you for your feedback. We will review it shortly.",
      [
        {
          text: "OK",
          onPress: () => {
            setReportModalVisible(false);
            setSelectedCategory(null);
            setReportDetails("");
          },
        },
      ]
    );
  };

  const handleCancelReport = () => {
    setReportModalVisible(false);
    setSelectedCategory(null);
    setReportDetails("");
  };

  const handleShare = async () => {
    setShowMenu(false);
    try {
      await Share.share({
        message: `Check out this find on TOP: ${item.title} for $${item.price.toFixed(
          2
        )}`,
      });
    } catch {
      // no-op if the share sheet fails or is dismissed
    }
  };

  return (
    <View style={styles.screen}>
      <Modal
        transparent
        animationType="fade"
        visible={showMenu}
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
          <View style={styles.menuBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.menuCard}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleReport}
                >
                  <Icon name="flag-outline" size={18} color="#111" />
                  <Text style={styles.menuItemText}>Report</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleShare}
                >
                  <Icon name="share-social-outline" size={18} color="#111" />
                  <Text style={styles.menuItemText}>Share</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelReport}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Report Listing</Text>
                <TouchableOpacity onPress={handleCancelReport}>
                  <Icon name="close" size={24} color="#111" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
                <Text style={styles.sectionTitle}>Select Report Category</Text>
                <View style={styles.categoriesContainer}>
                  {REPORT_CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryItem,
                        selectedCategory === category.id && styles.categoryItemSelected,
                      ]}
                      onPress={() => setSelectedCategory(category.id)}
                    >
                      <View style={styles.categoryRadio}>
                        {selectedCategory === category.id && (
                          <View style={styles.categoryRadioInner} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.categoryLabel,
                          selectedCategory === category.id && styles.categoryLabelSelected,
                        ]}
                      >
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionTitle}>Report Details</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Please describe your reason for reporting..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  value={reportDetails}
                  onChangeText={setReportDetails}
                />
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleCancelReport}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleSubmitReport}
                >
                  <Text style={styles.submitButtonText}>Submit Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Header
        title=""
        showBack
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate("MixMatch", { baseItem: item })}
              style={styles.headerIconBtn}
            >
              <Icon name="color-palette-outline" size={22} color="#111" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowMenu(true)}
              style={styles.headerIconBtn}
            >
              <Icon name="ellipsis-vertical" size={20} color="#111" />
            </TouchableOpacity>
          </View>
        }
      />
      <ScrollView contentContainerStyle={styles.container}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imageCarousel}
        >
          {item.images.map((uri: string, index: number) => (
            <Image
              key={`${item.id}-${index}`}
              source={{ uri }}
              style={styles.image}
            />
          ))}
        </ScrollView>

        <View style={styles.sectionCard}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.price}>${item.price.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.iconButton}
            >
              <Icon name="heart-outline" size={22} color="#111" />
            </TouchableOpacity>
            {/* Mix & Match chip aligned with like icon and same height */}
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.mixChipBtn}
              onPress={() => navigation.navigate("MixMatch", { baseItem: item })}
            >
              <Text style={styles.mixChipText}>Mix & Match</Text>
            </TouchableOpacity>

          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaLabel}>Size</Text>
              <Text style={styles.metaValue}>{item.size}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaLabel}>Condition</Text>
              <Text style={styles.metaValue}>{item.condition}</Text>
            </View>
          </View>
          <Text style={styles.description}>{item.description}</Text>

          <View style={styles.attributeRow}>
            <View style={styles.attributeBlock}>
              <Text style={styles.attributeLabel}>Brand</Text>
              <Text style={styles.attributeValue}>{item.brand}</Text>
            </View>
            {item.material ? (
              <View style={styles.attributeBlock}>
                <Text style={styles.attributeLabel}>Material</Text>
                <Text style={styles.attributeValue}>{item.material}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.colorsRow}>
            {item.colors.map((color: string) => (
              <Text key={color} style={styles.colorChip}>
                {color}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Seller</Text>
          <View style={styles.sellerRow}>
            <TouchableOpacity
              style={styles.sellerInfo}
              onPress={() =>
                navigation.navigate("UserProfile", {
                  username: item.seller.name,
                  avatar: item.seller.avatar,
                  rating: item.seller.rating,
                  sales: item.seller.sales,
                })
              }
            >
              <Image source={{ uri: item.seller.avatar }} style={styles.sellerAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sellerName}>{item.seller.name}</Text>
                <View style={styles.sellerMeta}>
                  <Icon name="star" size={13} color="#f5a623" />
                  <Text style={styles.sellerMetaText}>{item.seller.rating.toFixed(1)}</Text>
                  <Text style={styles.sellerMetaText}>|</Text>
                  <Text style={styles.sellerMetaText}>{item.seller.sales} sales</Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageBtn}>
              <Icon name="chatbubble-ellipses-outline" size={18} color="#000" />
              <Text style={styles.messageText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Shipping & Returns</Text>
          <Text style={styles.description}>
            Ships within 2 business days from New York, USA. Trackable shipping is included.
            Returns accepted within 7 days of delivery.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("Bag", { items: defaultBag })}
        >
          <Icon name="bag-add-outline" size={20} color="#111" />
          <Text style={styles.secondaryText}>Add to Bag</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            navigation.navigate("Checkout", {
              items: defaultBag,
              subtotal,
              shipping: shippingFee,
            })
          }
        >
          <Text style={styles.primaryText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: {
    paddingBottom: 120,
    rowGap: 16,
  },
  imageCarousel: {
    columnGap: 12,
    paddingHorizontal: 16,
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 16,
    backgroundColor: "#f2f2f2",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
  },
  headerIconBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
    paddingTop: 60,
    paddingRight: 16,
    alignItems: "flex-end",
  },
  menuCard: {
    width: 180,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#d9d9d9",
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111",
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e5e5e5",
    marginVertical: 4,
  },
  sectionCard: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
    rowGap: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
  },
  title: { fontSize: 20, fontWeight: "700" },
  price: { fontSize: 18, fontWeight: "700", color: "#111" },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  mixChipBtn: {
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#111",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  mixChipText: { fontSize: 13, fontWeight: "700", color: "#111" },
  metaRow: {
    flexDirection: "row",
    columnGap: 12,
  },
  metaPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f6f6f6",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 12,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: { fontSize: 14, fontWeight: "600", color: "#111", marginTop: 4 },
  description: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  attributeRow: {
    flexDirection: "row",
    columnGap: 16,
  },
  attributeBlock: { flex: 1 },
  attributeLabel: {
    fontSize: 12,
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  attributeValue: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 4,
  },
  colorsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  colorChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f0f0f0",
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
  },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    columnGap: 12,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e8e8e8",
  },
  sellerName: {
    fontSize: 15,
    fontWeight: "600",
  },
  sellerMeta: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
    marginTop: 2,
  },
  sellerMetaText: {
    fontSize: 13,
    color: "#666",
  },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  messageText: {
    fontSize: 13,
    fontWeight: "600",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 8,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#111",
    marginRight: 12,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  // Report Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e5",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
    marginBottom: 12,
  },
  categoriesContainer: {
    rowGap: 10,
    marginBottom: 24,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e5e5e5",
    backgroundColor: "#fff",
  },
  categoryItemSelected: {
    borderColor: "#111",
    backgroundColor: "#f5f5f5",
  },
  categoryRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#111",
  },
  categoryLabel: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  categoryLabelSelected: {
    color: "#111",
    fontWeight: "600",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#111",
    minHeight: 120,
    backgroundColor: "#f9f9f9",
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e5e5",
    columnGap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  submitButton: {
    backgroundColor: "#111",
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: "flex-end",
  },
});
