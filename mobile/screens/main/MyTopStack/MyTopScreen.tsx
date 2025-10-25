import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DEFAULT_AVATAR } from "../../../constants/assetUrls";
import Icon from "../../../components/Icon";
import FilterModal from "../../../components/FilterModal";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { MyTopStackParamList } from "./index";
import SoldTab from "./SoldTab";
import PurchasesTab from "./PurchasesTab";
import LikesTab from "./LikesTab";
import { useAuth } from "../../../contexts/AuthContext";
import { listingsService } from "../../../src/services/listingsService";
import { userService } from "../../../src/services/userService";
import type { ListingItem } from "../../../types/shop";
import type { UserListingsQueryParams } from "../../../src/services/listingsService";

const SORT_OPTIONS = ["Latest", "Price Low to High", "Price High to Low"] as const;
const SHOP_CONDITIONS = ["All", "New", "Like New", "Good", "Fair"] as const;

// --- 保证 3 列对齐 ---
function formatData(data: any[], numColumns: number) {
  const newData = [...data];
  const numberOfFullRows = Math.floor(newData.length / numColumns);
  let numberOfElementsLastRow = newData.length - numberOfFullRows * numColumns;

  while (numberOfElementsLastRow !== 0 && numberOfElementsLastRow !== numColumns) {
    newData.push({ id: `blank-${numberOfElementsLastRow}`, empty: true });
    numberOfElementsLastRow++;
  }

  return newData;
}

export default function MyTopScreen() {
  const { user } = useAuth(); // ✅ 使用全局用户状态
  const navigation =
    useNavigation<NativeStackNavigationProp<MyTopStackParamList>>();
  const route = useRoute<RouteProp<MyTopStackParamList, "MyTopMain">>();
  const lastRefreshRef = useRef<number | null>(null);
  const [activeTab, setActiveTab] =
    useState<"Shop" | "Sold" | "Purchases" | "Likes" | "Saved Outfits">("Shop");

  // ✅ 添加真实数据状态
  const [activeListings, setActiveListings] = useState<ListingItem[]>([]);
  const [soldListings, setSoldListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // ✅ 添加follow统计状态
  const [followStats, setFollowStats] = useState({
    followersCount: 0,
    followingCount: 0,
  });

  // ✅ 添加用户分类状态
  const [userCategories, setUserCategories] = useState<{ id: number; name: string; description: string; count: number }[]>([]);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<typeof SORT_OPTIONS[number]>("Latest");

  const [tempMinPrice, setTempMinPrice] = useState<string>("");
  const [tempMaxPrice, setTempMaxPrice] = useState<string>("");
  const [tempSortBy, setTempSortBy] = useState<typeof SORT_OPTIONS[number]>("Latest");

  // Category and Condition filters
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedCondition, setSelectedCondition] = useState<string>("All");
  const [tempCategory, setTempCategory] = useState<string>("All");
  const [tempCondition, setTempCondition] = useState<string>("All");

  // ✅ 获取用户分类
  const fetchUserCategories = async () => {
    try {
      console.log("📖 Fetching user categories");
      const categories = await listingsService.getUserCategories();
      setUserCategories(categories);
      console.log(`✅ Loaded ${categories.length} user categories`);
    } catch (error) {
      console.error("❌ Error fetching user categories:", error);
      // 保持空数组，不显示错误
    }
  };

  // ✅ 获取用户follow统计
  const fetchFollowStats = async () => {
    try {
      console.log("👥 Fetching follow stats");
      const stats = await userService.getMyFollowStats();
      setFollowStats(stats);
      console.log(`✅ Loaded follow stats: ${stats.followersCount} followers, ${stats.followingCount} following`);
    } catch (error) {
      console.error("❌ Error fetching follow stats:", error);
      // 保持默认值0，不显示错误
    }
  };

  // ✅ 获取用户listings
  const fetchUserListings = async (status?: 'active' | 'sold' | 'all', filters?: Partial<UserListingsQueryParams>) => {
    try {
      console.log("📖 Fetching user listings with status:", status, "filters:", filters);
      
      const params: UserListingsQueryParams = {
        status: status || 'active',
        ...filters,
      };
      
      console.log("📖 Final API params:", params);
      
      const listings = await listingsService.getUserListings(params);
      
      if (status === 'active' || status === undefined) {
        setActiveListings(listings);
      } else if (status === 'sold') {
        setSoldListings(listings);
      }
      
      console.log(`✅ Loaded ${listings.length} ${status || 'active'} listings`);
      console.log("📖 Sample listing:", listings[0]);
    } catch (error) {
      console.error("❌ Error fetching user listings:", error);
      Alert.alert("Error", "Failed to load listings. Please try again.");
    }
  };

  // ✅ 使用指定值应用filter（避免状态更新延迟）
  const applyFiltersWithValues = async (
    category: string,
    condition: string,
    minPriceValue: string,
    maxPriceValue: string,
    sortByValue: string
  ) => {
    setLoading(true);
    
    try {
      const filters: Partial<UserListingsQueryParams> = {};
      
      if (category !== "All") {
        filters.category = category;
      }
      
      if (condition !== "All") {
        filters.condition = condition;
      }
      
      if (minPriceValue) {
        filters.minPrice = parseFloat(minPriceValue);
      }
      
      if (maxPriceValue) {
        filters.maxPrice = parseFloat(maxPriceValue);
      }
      
      // 转换sortBy到API格式
      if (sortByValue === "Latest") {
        filters.sortBy = "latest";
      } else if (sortByValue === "Price Low to High") {
        filters.sortBy = "price_low_to_high";
      } else if (sortByValue === "Price High to Low") {
        filters.sortBy = "price_high_to_low";
      }
      
      console.log("🔍 Applying filters with values:", filters);
      
      // 重新获取active listings
      await fetchUserListings('active', filters);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 应用filter并重新获取数据
  const applyFilters = async () => {
    setLoading(true);
    
    try {
      const filters: Partial<UserListingsQueryParams> = {};
      
      if (selectedCategory !== "All") {
        filters.category = selectedCategory;
      }
      
      if (selectedCondition !== "All") {
        filters.condition = selectedCondition;
      }
      
      if (minPrice) {
        filters.minPrice = parseFloat(minPrice);
      }
      
      if (maxPrice) {
        filters.maxPrice = parseFloat(maxPrice);
      }
      
      // 转换sortBy到API格式
      if (sortBy === "Latest") {
        filters.sortBy = "latest";
      } else if (sortBy === "Price Low to High") {
        filters.sortBy = "price_low_to_high";
      } else if (sortBy === "Price High to Low") {
        filters.sortBy = "price_high_to_low";
      }
      
      console.log("🔍 Applying filters:", filters);
      
      // 重新获取active listings
      await fetchUserListings('active', filters);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 刷新数据
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchUserListings('active'),
        fetchUserListings('sold'),
        fetchFollowStats(),
        fetchUserCategories(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // ✅ 组件加载时获取数据
  useEffect(() => {
    if (user) {
      fetchUserListings('active');
      fetchUserListings('sold');
      fetchFollowStats();
      fetchUserCategories();
    }
  }, [user]);

  const refreshTrigger = route.params?.refreshTS;

  useEffect(() => {
    if (refreshTrigger && lastRefreshRef.current !== refreshTrigger) {
      lastRefreshRef.current = refreshTrigger;
      onRefresh();
    }
  }, [refreshTrigger, onRefresh]);

  // ✅ 当屏幕获得焦点时刷新数据
  useFocusEffect(
    useCallback(() => {
      if (route.params?.initialTab) {
        setActiveTab(route.params.initialTab);
        navigation.setParams({ initialTab: undefined });
      }
      
      // 刷新数据
      if (user) {
        onRefresh();
      }
    }, [route.params?.initialTab, navigation, user])
  );

  // ✅ 使用真实用户数据，提供默认值以防用户数据为空
  const displayUser = {
    username: user?.username || "User",
    followers: followStats.followersCount, // ✅ 使用真实的follow统计
    following: followStats.followingCount,  // ✅ 使用真实的follow统计
    reviews: 0,
    bio: user?.bio || "Welcome to my profile!",
    avatar: user?.avatar_url || DEFAULT_AVATAR,
    activeListings: activeListings, // ✅ 使用真实的active listings
  };

  // ✅ 处理listing点击
  const handleListingPress = (listing: ListingItem) => {
    navigation.navigate("ActiveListingDetail", { listingId: listing.id });
  };

  const tabs: Array<"Shop" | "Sold" | "Purchases" | "Likes" | "Saved Outfits"> = [
    "Shop",
    "Sold",
    "Purchases",
    "Likes",
	"Saved Outfits",
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      {/* 顶部 Header */}
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.username}>{displayUser.username}</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
          <Icon name="settings-sharp" size={24} color="#111" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <View key={tab} style={{ alignItems: "center" }}>
            <TouchableOpacity onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tab, activeTab === tab && styles.activeTab]}>
                {tab}
              </Text>
            </TouchableOpacity>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </View>
        ))}
      </View>

      {/* 内容区 */}
      <View style={{ flex: 1 }}>
        {activeTab === "Shop" && (
          <FlatList
            data={
              displayUser.activeListings.length
                ? formatData(displayUser.activeListings, 3)
                : []
            }
            keyExtractor={(item) => String(item.id)}
            numColumns={3}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListHeaderComponent={
              <View style={styles.headerContent}>
                {/* Profile 区 */}
                <View style={styles.profileRow}>
                  <Image 
                    source={
                      user?.avatar_url && typeof user.avatar_url === 'string' && user.avatar_url.startsWith('http') 
                        ? { uri: user.avatar_url } 
                        : DEFAULT_AVATAR
                    } 
                    style={styles.avatar} 
                  />
                  <View style={styles.statsRow}>
                    <Text style={styles.stats}>{displayUser.followers} followers</Text>
                    <Text style={styles.stats}>{displayUser.following} following</Text>
                    <Text style={styles.stats}>{displayUser.reviews} reviews</Text>
                  </View>
                </View>

                {/* Bio */}
                <View style={styles.bioRow}>
                  <Text style={styles.bio}>{displayUser.bio}</Text>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate("EditProfile")}
                  >
                    <Text style={styles.editBtnText}>Edit Profile</Text>
                  </TouchableOpacity>
                </View>

                {/* Active Title */}
                <View style={styles.activeRow}>
                  <Text style={styles.activeTitle}>
                    Active ({displayUser.activeListings.length} listings)
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setFilterModalVisible(true)}
                    style={styles.filterButtonContainer}
                  >
                    <Icon name="filter" size={24} color="#111" />
                    {(selectedCategory !== "All" || selectedCondition !== "All" || minPrice || maxPrice || sortBy !== "Latest") && (
                      <View style={styles.filterBadge}>
                        <Text style={styles.filterBadgeText}>
                          {(selectedCategory !== "All" ? 1 : 0) + (selectedCondition !== "All" ? 1 : 0) + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (sortBy !== "Latest" ? 1 : 0)}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            }
            ListHeaderComponentStyle={{ paddingHorizontal: 0 }} // ✅ 防止默认 padding
            contentContainerStyle={{
              paddingBottom: 60,
            }}
            renderItem={({ item }) =>
              item.empty ? (
                <View style={[styles.itemBox, styles.itemInvisible]} />
              ) : (
                <TouchableOpacity
                  style={styles.itemBox}
                  onPress={() => handleListingPress(item as ListingItem)}
                >
                  {/* ✅ 使用真实的listing数据 */}
                  {(() => {
                    const listing = item as ListingItem;
                    const imageUri = listing.images && listing.images.length > 0 
                      ? listing.images[0] 
                      : "https://via.placeholder.com/300x300/f4f4f4/999999?text=No+Image";
                    return <Image source={{ uri: imageUri }} style={styles.itemImage} />;
                  })()}
                </TouchableOpacity>
              )
            }
            ListEmptyComponent={
              loading ? (
                <View style={[styles.emptyBox]}>
                  <Text style={styles.emptyText}>Loading...</Text>
                </View>
              ) : (
                <View style={[styles.emptyBox]}>
                  <Text style={styles.emptyText}>
                    You haven't listed anything for sale yet.{"\n"}Tap + below to get started.
                  </Text>
                </View>
              )
            }
          />
        )}

        {activeTab === "Sold" && <SoldTab />}
        {activeTab === "Purchases" && <PurchasesTab />}
        {activeTab === "Likes" && <LikesTab />}
      </View>

      <FilterModal
        visible={filterModalVisible}
        title="My Listings Filters"
        sections={[
          {
            key: "category",
            title: "Category",
            options: [
              { label: "All", value: "All" },
              ...userCategories.map(category => ({
                label: `${category.name} (${category.count})`,
                value: category.name,
              })),
            ],
            selectedValue: tempCategory,
            onSelect: (value) => setTempCategory(String(value)),
          },
          {
            key: "condition",
            title: "Condition",
            options: SHOP_CONDITIONS.map((condition) => ({
              label: condition,
              value: condition,
            })),
            selectedValue: tempCondition,
            onSelect: (value) => setTempCondition(String(value)),
          },
          {
            key: "priceRange",
            title: "Price Range",
            type: "range",
            minValue: parseFloat(tempMinPrice) || 0,
            maxValue: parseFloat(tempMaxPrice) || 0,
            minPlaceholder: "$0",
            maxPlaceholder: "$1000+",
            onMinChange: setTempMinPrice,
            onMaxChange: setTempMaxPrice,
          },
          {
            key: "sortBy",
            title: "Sort By",
            options: SORT_OPTIONS.map((option) => ({
              label: option,
              value: option,
            })),
            selectedValue: tempSortBy,
            onSelect: (value) => setTempSortBy(String(value) as typeof SORT_OPTIONS[number]),
          },
        ]}
        onClose={() => setFilterModalVisible(false)}
        onApply={() => {
          setSelectedCategory(tempCategory);
          setSelectedCondition(tempCondition);
          setMinPrice(tempMinPrice);
          setMaxPrice(tempMaxPrice);
          setSortBy(tempSortBy);
          setFilterModalVisible(false);
          
          // 立即应用filter，使用临时值
          applyFiltersWithValues(tempCategory, tempCondition, tempMinPrice, tempMaxPrice, tempSortBy);
        }}
        onClear={() => {
          setTempCategory("All");
          setTempCondition("All");
          setTempMinPrice("");
          setTempMaxPrice("");
          setTempSortBy("Latest");
          
          // 立即清除filter
          setSelectedCategory("All");
          setSelectedCondition("All");
          setMinPrice("");
          setMaxPrice("");
          setSortBy("Latest");
          applyFiltersWithValues("All", "All", "", "", "Latest");
        }}
        applyButtonLabel="Apply Filters"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 48,
  },
  username: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },

  // Tabs
  tabs: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
    paddingVertical: 4,
  },
  tab: { fontSize: 18, color: "#666", paddingVertical: 6 },
  activeTab: { color: "#000", fontWeight: "800" },
  tabIndicator: {
    marginTop: 2,
    height: 3,
    width: 36,
    borderRadius: 999,
    backgroundColor: "#000",
  },

  // Header 内容
  headerContent: {
    rowGap: 12,
    paddingBottom: 8,
  },
  profileRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 16,
    paddingHorizontal: 12, // ✅ 改为与 grid 对齐
  },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#eee" },
  statsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stats: { color: "#333", fontSize: 14 },
  bioRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    columnGap: 12,
    paddingHorizontal: 12, // ✅ 对齐
  },
  bio: { flex: 1, fontSize: 15, lineHeight: 20 },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    alignSelf: "flex-start",
  },
  editBtnText: { fontWeight: "600" },
  activeRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  activeTitle: { fontSize: 17, fontWeight: "700" },
  filterButtonContainer: {
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FF4D4D",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },

  // Empty 状态
  emptyBox: {
    marginTop: 10,
    marginHorizontal: 16,
    backgroundColor: "#E6F0FF",
    borderRadius: 12,
    padding: 20,
  },
  emptyText: { textAlign: "center", color: "#555" },

  // Grid
  itemBox: {
    flex: 1,
    margin: 2,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f8f8f8",
  },
  itemImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  itemInvisible: {
    backgroundColor: "transparent",
  },
});