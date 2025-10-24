import React, { useMemo, useState, useEffect } from "react";
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
import { likesService, cartService } from "../../../src/services";
import { useAuth } from "../../../contexts/AuthContext";

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

const formatGenderLabel = (value?: string | null) => {
  if (!value) return "Unisex";
  const lower = value.toLowerCase();
  if (lower === "men" || lower === "male") return "Men";
  if (lower === "women" || lower === "female") return "Women";
  if (lower === "unisex") return "Unisex";
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const formatDateString = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
};


export default function ListingDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<BuyStackParamList>>();
  const {
    params: { item },
  } = useRoute<RouteProp<BuyStackParamList, "ListingDetail">>();
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [reportDetails, setReportDetails] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isLoadingLike, setIsLoadingLike] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // 安全处理 item 数据，兼容 images 和 imageUrls 字段
  const safeItem = useMemo(() => {
    if (!item) return null;
    
    // 调试：查看原始item数据
    console.log('🔍 Debug - Original item:', item);
    console.log('🔍 Debug - Original item.seller:', item.seller);
    
    const result = {
      ...item,
      // 兼容处理：优先使用 images，如果没有则使用 imageUrls
      images: Array.isArray(item.images) ? item.images : 
              Array.isArray(item.imageUrls) ? item.imageUrls : [],
    };
    
    // 调试：查看转换后的safeItem
    console.log('🔍 Debug - Converted safeItem:', result);
    console.log('🔍 Debug - Converted safeItem.seller:', result.seller);
    
    return result;
  }, [item]);

  const defaultBag = useMemo<BagItem[]>(
    () => safeItem ? [{ item: safeItem, quantity: 1 }] : [],
    [safeItem],
  );
  const subtotal = useMemo(
    () => defaultBag.reduce((sum, current) => {
      const price = typeof current.item.price === 'number' ? current.item.price : parseFloat(current.item.price || '0');
      return sum + price * current.quantity;
    }, 0),
    [defaultBag],
  );
  const shippingFee = 8;

  const genderLabel = useMemo(() => formatGenderLabel(safeItem?.gender), [safeItem?.gender]);
  const likesCount = safeItem?.likesCount ?? 0;
  const listedOn = useMemo(() => formatDateString(safeItem?.createdAt), [safeItem?.createdAt]);
  const updatedOn = useMemo(() => formatDateString(safeItem?.updatedAt), [safeItem?.updatedAt]);

  // 检查是否是自己的商品
  const isOwnListing = useMemo(() => {
    console.log('🔍 Debug - Current user:', user);
    console.log('🔍 Debug - SafeItem seller:', safeItem?.seller);
    console.log('🔍 Debug - User ID:', user?.id);
    console.log('🔍 Debug - Seller ID:', safeItem?.seller?.id);
    console.log('🔍 Debug - User ID type:', typeof user?.id);
    console.log('🔍 Debug - Seller ID type:', typeof safeItem?.seller?.id);
    
    // 确保类型一致进行比较
    const userId = user?.id ? Number(user.id) : null;
    const sellerId = safeItem?.seller?.id ? Number(safeItem.seller.id) : null;
    
    console.log('🔍 Debug - Converted User ID:', userId);
    console.log('🔍 Debug - Converted Seller ID:', sellerId);
    console.log('🔍 Debug - IDs match:', userId && sellerId && userId === sellerId);
    
    const result = userId && sellerId && userId === sellerId;
    console.log('🔍 Debug - isOwnListing result:', result);
    return result;
  }, [user, safeItem]);

  // 检查Like状态
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!safeItem?.id || isOwnListing) return;
      
      try {
        const liked = await likesService.getLikeStatus(safeItem.id);
        setIsLiked(liked);
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };

    checkLikeStatus();
  }, [safeItem?.id, isOwnListing]);

  // 处理Like按钮点击
  const handleLikeToggle = async () => {
    if (!safeItem?.id || isLoadingLike || isOwnListing) return;
    
    setIsLoadingLike(true);
    try {
      const newLikedStatus = await likesService.toggleLike(safeItem.id, isLiked);
      setIsLiked(newLikedStatus);
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like status. Please try again.');
    } finally {
      setIsLoadingLike(false);
    }
  };

  // 处理Add to Cart按钮点击
  const handleAddToCart = async () => {
    if (!safeItem?.id || isAddingToCart || isOwnListing) return;
    
    setIsAddingToCart(true);
    try {
      await cartService.addToCart(safeItem.id.toString(), 1);
      Alert.alert('Success', 'Item added to cart successfully!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

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
      if (safeItem) {
        await Share.share({
          message: `Check out this find on TOP: ${safeItem.title} for $${typeof safeItem.price === 'number' ? safeItem.price.toFixed(2) : parseFloat(safeItem.price || '0').toFixed(2)}`,
        });
      }
    } catch {
      // no-op if the share sheet fails or is dismissed
    }
  };

  // 如果数据未加载完成，显示加载状态
  if (!safeItem) {
    return (
      <View style={styles.screen}>
        <Header title="" showBack />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading item details...</Text>
        </View>
      </View>
    );
  }

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
                  {Array.isArray(REPORT_CATEGORIES) && REPORT_CATEGORIES.map((category) => (
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
              onPress={() => safeItem && navigation.navigate("MixMatch", { baseItem: safeItem })}
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
          {(safeItem?.images?.filter(img => img && typeof img === 'string') || []).map((uri: string, index: number) => (
            <Image
              key={`${safeItem.id}-${index}`}
              source={{ uri }}
              style={styles.image}
              onError={() => console.warn(`Failed to load image: ${uri}`)}
            />
          ))}
          {/* 如果没有有效图片，显示默认图片 */}
          {(!safeItem?.images || safeItem.images.length === 0 || !safeItem.images.some(img => img && typeof img === 'string')) && (
            <Image
              source={{ uri: "https://via.placeholder.com/300x300/f4f4f4/999999?text=No+Image" }}
              style={styles.image}
            />
          )}
        </ScrollView>

        <View style={styles.sectionCard}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{safeItem?.title || 'Loading...'}</Text>
              <Text style={styles.price}>${typeof safeItem?.price === 'number' ? safeItem.price.toFixed(2) : parseFloat(safeItem?.price || '0').toFixed(2)}</Text>
            </View>
            <View style={styles.likeButtonWrapper}>
              <TouchableOpacity
                accessibilityRole="button"
                style={[styles.iconButton, isLiked && styles.iconButtonLiked, isOwnListing && styles.iconButtonDisabled]}
              onPress={handleLikeToggle}
              disabled={isLoadingLike || isOwnListing}
              >
                <Icon 
                name={isLiked ? "heart" : "heart-outline"} 
                size={22} 
                color={isOwnListing ? "#999" : (isLiked ? "#F54B3D" : "#111")} 
              />
              </TouchableOpacity>
              {likesCount > 0 && (
                <View style={styles.likeBadge}>
                  <Text style={styles.likeBadgeText}>
                    {likesCount > 99 ? "99+" : likesCount}
                  </Text>
                </View>
              )}
            </View>
            {/* Mix & Match chip aligned with like icon and same height */}
            <TouchableOpacity
              accessibilityRole="button"
              style={[styles.mixChipBtn, isOwnListing && styles.mixChipBtnDisabled]}
              onPress={() => !isOwnListing && safeItem && navigation.navigate("MixMatch", { baseItem: safeItem })}
              disabled={isOwnListing}
            >
              <Text style={[styles.mixChipText, isOwnListing && styles.mixChipTextDisabled]}>Mix & Match</Text>
            </TouchableOpacity>

          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaLabel}>Size</Text>
              <Text style={styles.metaValue}>
                {safeItem?.size && safeItem.size !== 'N/A' && safeItem.size !== 'Select' 
                  ? safeItem.size 
                  : 'Not specified'}
              </Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaLabel}>Condition</Text>
              <Text style={styles.metaValue}>
                {safeItem?.condition && safeItem.condition !== 'Select' 
                  ? safeItem.condition 
                  : 'Not specified'}
              </Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaLabel}>Gender</Text>
              <Text style={styles.metaValue}>{genderLabel}</Text>
            </View>
          </View>
          <Text style={styles.description}>{safeItem?.description || 'No description available'}</Text>

          <View style={styles.attributeRow}>
            {/* 只在有值时显示 Brand */}
            {safeItem?.brand && safeItem.brand !== '' && safeItem.brand !== 'Select' && (
              <View style={styles.attributeBlock}>
                <Text style={styles.attributeLabel}>Brand</Text>
                <Text style={styles.attributeValue}>{safeItem.brand}</Text>
              </View>
            )}
            {/* 只在有值时显示 Material */}
            {safeItem?.material && safeItem.material !== 'Select' && safeItem.material !== 'Polyester' && (
              <View style={styles.attributeBlock}>
                <Text style={styles.attributeLabel}>Material</Text>
                <Text style={styles.attributeValue}>{safeItem.material}</Text>
              </View>
            )}
            {/* 如果 Brand 和 Material 都没有，显示占位信息 */}
            {(!safeItem?.brand || safeItem.brand === '' || safeItem.brand === 'Select') && 
             (!safeItem?.material || safeItem.material === 'Select' || safeItem.material === 'Polyester') && (
              <View style={styles.attributeBlock}>
                <Text style={styles.attributeLabel}>Additional Details</Text>
                <Text style={[styles.attributeValue, { color: '#999', fontStyle: 'italic' }]}>
                  Not provided by seller
                </Text>
              </View>
            )}
          </View>

          {/* Tags Section */}
          {safeItem?.tags && Array.isArray(safeItem.tags) && safeItem.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.tagsLabel}>Tags</Text>
              <View style={styles.tagsContainer}>
                {safeItem.tags.map((tag, index) => (
                  <View key={index} style={styles.tagChip}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {(listedOn || updatedOn) && (
            <View style={styles.infoSection}>
              <Text style={styles.infoHeading}>Listing Info</Text>
              {listedOn && (
                <Text style={styles.infoText}>Listed on {listedOn}</Text>
              )}
              {updatedOn && (
                <Text style={styles.infoText}>Last updated {updatedOn}</Text>
              )}
            </View>
          )}

        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Seller</Text>
          <View style={styles.sellerRow}>
            <TouchableOpacity
              style={styles.sellerInfo}
              onPress={() =>
                safeItem?.seller && navigation.navigate("UserProfile", {
                  username: safeItem.seller.name,
                  avatar: safeItem.seller.avatar,
                  rating: safeItem.seller.rating,
                  sales: safeItem.seller.sales,
                })
              }
            >
              <Image 
                source={{ uri: safeItem?.seller?.avatar && safeItem.seller.avatar.trim() !== '' ? safeItem.seller.avatar : undefined }} 
                style={styles.sellerAvatar} 
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.sellerName}>{safeItem?.seller?.name || 'Unknown Seller'}</Text>
                <View style={styles.sellerMeta}>
                  <Icon name="star" size={13} color="#f5a623" />
                  <Text style={styles.sellerMetaText}>{safeItem?.seller?.rating?.toFixed(1) || '0.0'}</Text>
                  <Text style={styles.sellerMetaText}>|</Text>
                  <Text style={styles.sellerMetaText}>{safeItem?.seller?.sales || 0} sales</Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.messageBtn}
              onPress={() => {
                // 导航到Inbox聊天框
                const rootNavigation = navigation
                  .getParent()
                  ?.getParent() as any;
                
                rootNavigation?.navigate("Inbox", {
                  screen: "Chat",
                  params: {
                    sender: safeItem?.seller?.name || "Seller",
                    kind: "order",
                    order: {
                      id: safeItem?.id || "new-order",
                      product: {
                        title: safeItem?.title || "Item",
                        price: safeItem?.price || 0,
                        size: safeItem?.size,
                        image: safeItem?.images?.[0] || ""
                      },
                      seller: {
                        name: safeItem?.seller?.name || "Seller",
                        avatar: safeItem?.seller?.avatar
                      },
                      status: "Inquiry"
                    }
                  }
                });
              }}
            >
              <Icon name="chatbubble-ellipses-outline" size={18} color="#000" />
              <Text style={styles.messageText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Shipping</Text>
          <Text style={styles.description}>
            {safeItem?.shippingOption && safeItem.shippingOption !== 'Select' ? (
              <>
                {safeItem.shippingOption}
                {safeItem.shippingFee && Number(safeItem.shippingFee) > 0 
                  ? ` • Shipping fee: $${Number(safeItem.shippingFee).toFixed(2)}` 
                  : ''}
                {safeItem.shippingOption === "Meet-up" && safeItem?.location 
                  ? `\n📍 Meet-up location: ${safeItem.location}` 
                  : ''}
              </>
            ) : (
              'Please contact seller for shipping options and rates.'
            )}
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Returns & Protection</Text>
          <Text style={styles.description}>
            All purchases are protected by TOP Care. Returns accepted within 7 days of delivery for items not as described. Please review item details carefully before purchase.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {!isOwnListing && (
          <>
            <TouchableOpacity
              style={[styles.secondaryButton, isAddingToCart && styles.secondaryButtonDisabled]}
              onPress={handleAddToCart}
              disabled={isAddingToCart}
            >
              <Icon name="bag-add-outline" size={20} color={isAddingToCart ? "#999" : "#111"} />
              <Text style={[styles.secondaryText, isAddingToCart && styles.secondaryTextDisabled]}>
                {isAddingToCart ? 'Adding...' : 'Add to Bag'}
              </Text>
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
          </>
        )}
        {isOwnListing && (
          <View style={styles.ownListingMessage}>
            <Text style={styles.ownListingText}>This is your own listing</Text>
          </View>
        )}
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
  iconButtonLiked: {
    borderColor: "#F54B3D",
    backgroundColor: "#FFF5F5",
  },
  iconButtonDisabled: {
    backgroundColor: "#f5f5f5",
    opacity: 0.6,
  },
  likeButtonWrapper: {
    position: "relative",
  },
  likeBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  likeBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
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
  mixChipBtnDisabled: {
    backgroundColor: "#f5f5f5",
    opacity: 0.6,
  },
  mixChipTextDisabled: {
    color: "#999",
  },
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
  tagsSection: {
    marginTop: 16,
  },
  tagsLabel: {
    fontSize: 12,
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  tagText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  infoSection: {
    rowGap: 4,
  },
  infoHeading: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  infoText: {
    fontSize: 13,
    color: "#444",
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
  secondaryButtonDisabled: {
    backgroundColor: "#f5f5f5",
    opacity: 0.6,
  },
  secondaryTextDisabled: {
    color: "#999",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  ownListingMessage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  ownListingText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
});
