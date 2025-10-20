import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import FilterModal from "../../../components/FilterModal";
import { MOCK_LISTINGS } from "../../../mocks/shop";
import type { ListingItem } from "../../../types/shop";
import type { BuyStackParamList } from "./index";

type UserProfileParam = RouteProp<BuyStackParamList, "UserProfile">;
type BuyNavigation = NativeStackNavigationProp<BuyStackParamList>;

const REPORT_CATEGORIES = [
  { id: "prohibited_items", label: "Selling prohibited items" },
  { id: "bullying", label: "Bullying or abusive behaviour" },
  { id: "unsafe", label: "Concerning or unsafe behaviour" },
  { id: "hate_speech", label: "Hate speech or discrimination" },
  { id: "sexual_harassment", label: "Sexual harassment" },
  { id: "scamming", label: "Scamming" },
  { id: "outside_payment", label: "Out of app payment or activity" },
  { id: "other", label: "Something else" },
];

const SHOP_CATEGORIES = ["All", "Tops", "Bottoms", "Outerwear", "Footwear", "Accessories", "Dresses"] as const;
const SHOP_SIZES = ["All", "My Size", "XS", "S", "M", "L", "XL", "XXL"] as const;
const SHOP_CONDITIONS = ["All", "New", "Like New", "Good", "Fair"] as const;
const SORT_OPTIONS = ["Latest", "Price Low to High", "Price High to Low"] as const;

const REVIEW_FILTERS = {
  ROLE: ["All", "From Buyer", "From Seller"] as const,
  RATING: ["All", "Positive", "Negative"] as const,
};

const likedGallery = [
  "https://tse1.mm.bing.net/th/id/OIP._PU2jbpd_bGX-M3WoLm6IAHaLe?rs=1&pid=ImgDetMain&o=7&rm=3",
  "https://tse3.mm.bing.net/th/id/OIP.mbv8-A49xgbIH4hkKjhCBwHaJc?rs=1&pid=ImgDetMain&o=7&rm=3",
  "https://y2kdream.com/cdn/shop/files/Y2K-Football-Crop-Top-6.webp?v=1723621579&width=750",
  "https://tse3.mm.bing.net/th/id/OIP.81YGmCDrRsgih3_rHL6qxgHaHa?rs=1&pid=ImgDetMain&o=7&rm=3",
  "https://tse3.mm.bing.net/th/id/OIP.VLA_zUUPCS-z2IemiQ43PgHaHa?rs=1&pid=ImgDetMain&o=7&rm=3",
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=640&q=80",
];

const mockReviews = [
  {
    id: "r-1",
    name: "Ava L.",
    avatar: "https://i.pravatar.cc/100?img=21",
    rating: 5,
    comment: "Loved the packaging and the dress was spotless. Would buy again!",
    time: "2 days ago",
    date: "2024-01-15",
    type: "buyer" as const,
    hasPhoto: true,
  },
  {
    id: "r-2",
    name: "Mina K.",
    avatar: "https://i.pravatar.cc/100?img=32",
    rating: 4,
    comment: "Quick shipper and item matched the description.",
    time: "Last week",
    date: "2024-01-10",
    type: "buyer" as const,
    hasPhoto: false,
  },
  {
    id: "r-3",
    name: "Sarah T.",
    avatar: "https://i.pravatar.cc/100?img=45",
    rating: 5,
    comment: "Great buyer! Easy communication and quick payment.",
    time: "3 days ago",
    date: "2024-01-14",
    type: "seller" as const,
    hasPhoto: false,
  },
  {
    id: "r-4",
    name: "Emma R.",
    avatar: "https://i.pravatar.cc/100?img=28",
    rating: 2,
    comment: "Item arrived late and wasn't as described.",
    time: "1 week ago",
    date: "2024-01-08",
    type: "buyer" as const,
    hasPhoto: true,
  },
];

function formatData(data: any[], numColumns: number) {
  const result = [...data];
  const fullRows = Math.floor(result.length / numColumns);
  let itemsLastRow = result.length - fullRows * numColumns;

  while (itemsLastRow !== 0 && itemsLastRow !== numColumns) {
    result.push({ id: `blank-${itemsLastRow}`, empty: true });
    itemsLastRow++;
  }
  return result;
}

export default function UserProfileScreen() {
  const navigation = useNavigation<BuyNavigation>();
  const {
    params: { username, avatar, rating, sales },
  } = useRoute<UserProfileParam>();

  const [activeTab, setActiveTab] = useState<"Shop" | "Likes" | "Reviews">(
    "Shop"
  );
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [reportDetails, setReportDetails] = useState("");

  // Shop Filter States (Applied filters)
  const [shopCategory, setShopCategory] = useState<string>("All");
  const [shopSize, setShopSize] = useState<string>("All");
  const [shopCondition, setShopCondition] = useState<string>("All");
  const [shopSortBy, setShopSortBy] = useState<typeof SORT_OPTIONS[number]>("Latest");

  // Shop Filter Modal States
  const [shopFilterVisible, setShopFilterVisible] = useState(false);
  const [tempShopCategory, setTempShopCategory] = useState<string>("All");
  const [tempShopSize, setTempShopSize] = useState<string>("All");
  const [tempShopCondition, setTempShopCondition] = useState<string>("All");
  const [tempShopSortBy, setTempShopSortBy] = useState<typeof SORT_OPTIONS[number]>("Latest");

  // Review Filter States
  const [reviewsFilterVisible, setReviewsFilterVisible] = useState(false);
  const [showLatest, setShowLatest] = useState(false);
  const [showWithPhotos, setShowWithPhotos] = useState(false);
  const [reviewRole, setReviewRole] = useState<string>("All");
  const [reviewRating, setReviewRating] = useState<string>("All");

  // Mock data for profile stats
  const followers = 1234;
  const following = 567;
  const reviewsCount = mockReviews.length;

  const userListings = useMemo(
    () =>
      MOCK_LISTINGS.filter(
        (listing) => listing.seller.name.toLowerCase() === username.toLowerCase()
      ),
    [username]
  );

  const filteredListings = useMemo(() => {
    let results = userListings;

    if (shopCategory !== "All") {
      results = results.filter((item) => item.category === shopCategory);
    }

    if (shopSize !== "All") {
      if (shopSize === "My Size") {
        const userPreferredSize = "M"; // TODO: pull from user settings once available
        results = results.filter((item) => item.size === userPreferredSize);
      } else {
        results = results.filter((item) => item.size === shopSize);
      }
    }

    if (shopCondition !== "All") {
      results = results.filter((item) => item.condition === shopCondition);
    }

    if (shopSortBy === "Price Low to High") {
      results.sort((a, b) => a.price - b.price);
    } else if (shopSortBy === "Price High to Low") {
      results.sort((a, b) => b.price - a.price);
    }

    return results;
  }, [userListings, shopCategory, shopSize, shopCondition, shopSortBy]);

  const listingsData = useMemo(
    () => formatData(filteredListings, 3),
    [filteredListings]
  );

  const filteredReviews = useMemo(() => {
    let results = mockReviews;

    if (reviewRole === "From Buyer") {
      results = results.filter((review) => review.type === "buyer");
    } else if (reviewRole === "From Seller") {
      results = results.filter((review) => review.type === "seller");
    }

    if (reviewRating === "Positive") {
      results = results.filter((review) => review.rating >= 4);
    } else if (reviewRating === "Negative") {
      results = results.filter((review) => review.rating < 4);
    }

    if (showWithPhotos) {
      results = results.filter((review) => review.hasPhoto);
    }

    if (showLatest) {
      results = [...results].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }

    return results;
  }, [reviewRole, reviewRating, showWithPhotos, showLatest]);

  const handleReport = () => {
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

  const handleOpenShopFilters = () => {
    // Sync temp filters with current applied filters
    setTempShopCategory(shopCategory);
    setTempShopSize(shopSize);
    setTempShopCondition(shopCondition);
    setTempShopSortBy(shopSortBy);
    setShopFilterVisible(true);
  };

  const handleApplyShopFilters = () => {
    // Apply temp filters to actual filters
    setShopCategory(tempShopCategory);
    setShopSize(tempShopSize);
    setShopCondition(tempShopCondition);
    setShopSortBy(tempShopSortBy);
    setShopFilterVisible(false);
  };

  const handleClearShopFilters = () => {
    setTempShopCategory("All");
    setTempShopSize("All");
    setTempShopCondition("All");
    setTempShopSortBy("Latest");
  };

  const handleClearReviewFilters = () => {
    setShowLatest(false);
    setShowWithPhotos(false);
    setReviewRole("All");
    setReviewRating("All");
  };

  const shopActiveFiltersCount = useMemo(() => {
    let count = 0;
    if (shopCategory !== "All") count++;
    if (shopSize !== "All") count++;
    if (shopCondition !== "All") count++;
    if (shopSortBy !== "Latest") count++;
    return count;
  }, [shopCategory, shopSize, shopCondition, shopSortBy]);

  const reviewActiveFiltersCount = useMemo(() => {
    let count = 0;
    if (showLatest) count++;
    if (showWithPhotos) count++;
    if (reviewRole !== "All") count++;
    if (reviewRating !== "All") count++;
    return count;
  }, [showLatest, showWithPhotos, reviewRole, reviewRating]);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header 
        title={username} 
        showBack 
        rightAction={
          <TouchableOpacity onPress={handleReport} style={styles.reportButton}>
            <Icon name="flag-outline" size={22} color="#111" />
          </TouchableOpacity>
        }
      />

      <View style={styles.profileSection}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <View style={{ rowGap: 6, flex: 1 }}>
          <Text style={styles.profileName}>{username}</Text>
          <View style={styles.profileMeta}>
            <Icon name="star" size={14} color="#f5a623" />
            <Text style={styles.profileMetaText}>{rating.toFixed(1)}</Text>
            <Text style={styles.profileMetaText}>·</Text>
            <Text style={styles.profileMetaText}>{sales} sales</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.messageBtn}>
          <Icon name="chatbubble-ellipses-outline" size={18} color="#000" />
          <Text style={styles.messageText}>Message</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{followers}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{following}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{reviewsCount}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {(["Shop", "Likes", "Reviews"] as const).map((tab) => (
          <View key={tab} style={{ alignItems: "center" }}>
            <TouchableOpacity onPress={() => setActiveTab(tab)}>
              <Text
                style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === "Shop" ? (
          <>
            <View style={styles.filterBar}>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={handleOpenShopFilters}
              >
                <Icon name="options-outline" size={16} color="#111" />
                <Text style={styles.filterButtonText}>Filter</Text>
                {shopActiveFiltersCount > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{shopActiveFiltersCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.resultCount}>{filteredListings.length} items</Text>
            </View>
            {filteredListings.length ? (
              <FlatList
                data={listingsData}
                keyExtractor={(item, index) =>
                  String(item?.id ?? `spacer-${index}`)
                }
                numColumns={3}
                contentContainerStyle={styles.gridContent}
                renderItem={({ item }) =>
                  item.empty ? (
                    <View style={[styles.gridItem, styles.gridItemInvisible]} />
                  ) : (
                    <TouchableOpacity
                      style={styles.gridItem}
                      onPress={() =>
                        navigation.navigate("ListingDetail", { item: item as ListingItem })
                      }
                    >
                      <Image
                        source={{ 
                          uri: (item as ListingItem).images?.[0] || "https://via.placeholder.com/300x300/f4f4f4/999999?text=No+Image"
                        }}
                        style={styles.gridImage}
                        onError={() => console.warn(`Failed to load grid image: ${(item as ListingItem).images?.[0]}`)}
                      />
                    </TouchableOpacity>
                  )
                }
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No listings found</Text>
                <Text style={styles.emptySubtitle}>
                  Try adjusting your filters
                </Text>
              </View>
            )}
          </>
        ) : null}

        {activeTab === "Likes" ? (
          <FlatList
            data={formatData(
              likedGallery.map((uri, index) => ({ id: `like-${index}`, uri })),
              3
            )}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.gridContent}
            renderItem={({ item }) =>
              item.empty ? (
                <View style={[styles.gridItem, styles.gridItemInvisible]} />
              ) : (
                <View style={styles.gridItem}>
                  <Image source={{ uri: item.uri }} style={styles.gridImage} />
                  <View style={styles.likeBadge}>
                    <Icon name="heart" size={16} color="#f54b3d" />
                  </View>
                </View>
              )
            }
          />
        ) : null}

        {activeTab === "Reviews" ? (
          <>
            <View style={styles.filterBar}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.reviewFiltersScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.reviewFilterChip,
                    showLatest && styles.reviewFilterChipActive,
                  ]}
                  onPress={() => setShowLatest(!showLatest)}
                >
                  <Icon
                    name={showLatest ? "checkmark-circle" : "checkmark-circle-outline"}
                    size={16}
                    color={showLatest ? "#fff" : "#666"}
                  />
                  <Text
                    style={[
                      styles.reviewFilterChipText,
                      showLatest && styles.reviewFilterChipTextActive,
                    ]}
                  >
                    Latest
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.reviewFilterChip,
                    showWithPhotos && styles.reviewFilterChipActive,
                  ]}
                  onPress={() => setShowWithPhotos(!showWithPhotos)}
                >
                  <Icon
                    name={showWithPhotos ? "checkmark-circle" : "checkmark-circle-outline"}
                    size={16}
                    color={showWithPhotos ? "#fff" : "#666"}
                  />
                  <Text
                    style={[
                      styles.reviewFilterChipText,
                      showWithPhotos && styles.reviewFilterChipTextActive,
                    ]}
                  >
                    With Photos
                  </Text>
                </TouchableOpacity>
                {REVIEW_FILTERS.ROLE.slice(1).map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.reviewFilterChip,
                      reviewRole === role && styles.reviewFilterChipActive,
                    ]}
                    onPress={() => setReviewRole(reviewRole === role ? "All" : role)}
                  >
                    <Text
                      style={[
                        styles.reviewFilterChipText,
                        reviewRole === role && styles.reviewFilterChipTextActive,
                      ]}
                    >
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
                {REVIEW_FILTERS.RATING.slice(1).map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.reviewFilterChip,
                      reviewRating === rating && styles.reviewFilterChipActive,
                    ]}
                    onPress={() => setReviewRating(reviewRating === rating ? "All" : rating)}
                  >
                    <Text
                      style={[
                        styles.reviewFilterChipText,
                        reviewRating === rating && styles.reviewFilterChipTextActive,
                      ]}
                    >
                      {rating}
                    </Text>
                  </TouchableOpacity>
                ))}
                {reviewActiveFiltersCount > 0 && (
                  <TouchableOpacity
                    style={styles.clearFiltersBtn}
                    onPress={handleClearReviewFilters}
                  >
                    <Text style={styles.clearFiltersBtnText}>Clear All</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
            <FlatList
              data={filteredReviews}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.reviewList}
              renderItem={({ item }) => (
                <View style={styles.reviewCard}>
                  <Image source={{ uri: item.avatar }} style={styles.reviewAvatar} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewName}>{item.name}</Text>
                      <View style={styles.reviewStars}>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Icon
                            key={`${item.id}-star-${index}`}
                            name={index < item.rating ? "star" : "star-outline"}
                            size={13}
                            color="#f5a623"
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.reviewTime}>{item.time}</Text>
                    <Text style={styles.reviewComment}>{item.comment}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No reviews found</Text>
                  <Text style={styles.emptySubtitle}>
                    Try adjusting your filters
                  </Text>
                </View>
              }
            />
          </>
        ) : null}
      </View>

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
                <Text style={styles.modalTitle}>Report User</Text>
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

      <FilterModal
        visible={shopFilterVisible}
        title="Shop Filters"
        sections={[
          {
            key: "category",
            title: "Category",
            options: SHOP_CATEGORIES.map((category) => ({
              label: category,
              value: category,
            })),
            selectedValue: tempShopCategory,
            onSelect: (value) => setTempShopCategory(String(value)),
          },
          {
            key: "size",
            title: "Size",
            options: SHOP_SIZES.map((size) => ({
              label: size,
              value: size,
            })),
            selectedValue: tempShopSize,
            onSelect: (value) => setTempShopSize(String(value)),
          },
          {
            key: "condition",
            title: "Condition",
            options: SHOP_CONDITIONS.map((condition) => ({
              label: condition,
              value: condition,
            })),
            selectedValue: tempShopCondition,
            onSelect: (value) => setTempShopCondition(String(value)),
          },
          {
            key: "sort",
            title: "Sort By",
            options: SORT_OPTIONS.map((option) => ({
              label: option,
              value: option,
            })),
            selectedValue: tempShopSortBy,
            onSelect: (value) => setTempShopSortBy(String(value) as typeof SORT_OPTIONS[number]),
          },
        ]}
        onClose={() => setShopFilterVisible(false)}
        onClear={handleClearShopFilters}
        onApply={handleApplyShopFilters}
        applyButtonLabel={`Apply Filters (${filteredListings.length})`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  reportButton: {
    padding: 8,
    marginRight: 8,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    columnGap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#eee",
  },
  profileName: { fontSize: 18, fontWeight: "700", color: "#111" },
  profileMeta: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
  },
  profileMetaText: {
    fontSize: 14,
    color: "#666",
  },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#dcdcdc",
  },
  messageText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    rowGap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  statLabel: {
    fontSize: 12,
    color: "#777",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#ddd",
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 16,
    color: "#777",
    paddingVertical: 6,
    fontWeight: "500",
  },
  tabLabelActive: {
    color: "#111",
    fontWeight: "700",
  },
  tabIndicator: {
    marginTop: 2,
    height: 3,
    width: 36,
    borderRadius: 999,
    backgroundColor: "#111",
  },
  gridContent: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 120,
  },
  gridItem: {
    flex: 1,
    margin: 4,
    aspectRatio: 1,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#f1f1f1",
  },
  gridItemInvisible: {
    backgroundColor: "transparent",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  likeBadge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    rowGap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  reviewList: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 120,
    rowGap: 16,
  },
  reviewCard: {
    flexDirection: "row",
    columnGap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  reviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#eee",
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewName: { fontSize: 15, fontWeight: "700", color: "#111" },
  reviewStars: { flexDirection: "row", columnGap: 2 },
  reviewTime: { fontSize: 12, color: "#7a7a7a", marginTop: 4 },
  reviewComment: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },
  // Filter Bar Styles
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e5",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
  },
  filterBadge: {
    backgroundColor: "#111",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  resultCount: {
    fontSize: 13,
    color: "#666",
  },
  reviewFiltersScroll: {
    paddingHorizontal: 16,
    columnGap: 8,
  },
  reviewFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  reviewFilterChipActive: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  reviewFilterChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
  },
  reviewFilterChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  clearFiltersBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  clearFiltersBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
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
