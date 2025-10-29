import React, { useMemo, useState, useEffect } from "react";
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
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import Header from "../../../components/Header";
import ASSETS from "../../../constants/assetUrls";
import Icon from "../../../components/Icon";
import FilterModal from "../../../components/FilterModal";
import { MOCK_LISTINGS } from "../../../mocks/shop";
import type { ListingItem } from "../../../types/shop";
import type { BuyStackParamList } from "./index";
import { userService, type UserProfile } from "../../../src/services/userService";
import { likesService, messagesService, type LikedListing } from "../../../src/services";
import { authService } from "../../../src/services/authService";

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

const SHOP_CATEGORIES = ["All", "Accessories", "Bottoms", "Footwear", "Outerwear", "Tops"] as const;
const SHOP_APPAREL_SIZES = [
  "All",
  "My Size",
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
] as const;
const SHOP_SHOE_SIZES = [
  "All",
  "My Size",
  "35","36","37","38","39","40","41","42","43","44","45","46","47",
] as const;
const SHOP_ACCESSORY_SIZES = [
  "All",
  "My Size",
  "One Size",
  "Small",
  "Medium",
  "Large",
] as const;
const SHOP_CONDITIONS = ["All", "New", "Like New", "Good", "Fair", "Poor"] as const;
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
  const route = useRoute<UserProfileParam>();
  const { username: usernameParam, userId, avatar, rating, sales } = route.params || {};

  // 状态管理
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userListings, setUserListings] = useState<ListingItem[]>([]);
  const [likedListings, setLikedListings] = useState<LikedListing[]>([]);
  const [reviews, setReviews] = useState<any[]>([]); // 🔥 新增：存储真实的 reviews
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [likesLoading, setLikesLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [username, setUsername] = useState<string>(usernameParam || "");

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
  const tempShopSizeOptions = useMemo(() => {
    const cat = tempShopCategory.toLowerCase();
    if (cat === "footwear") return SHOP_SHOE_SIZES as readonly string[];
    if (cat === "accessories") return SHOP_ACCESSORY_SIZES as readonly string[];
    return SHOP_APPAREL_SIZES;
  }, [tempShopCategory]);
  useEffect(() => {
    if (!tempShopSizeOptions.includes(tempShopSize as any)) {
      setTempShopSize("All");
    }
  }, [tempShopSizeOptions, tempShopSize]);

  // Review Filter States
  const [reviewsFilterVisible, setReviewsFilterVisible] = useState(false);
  const [showLatest, setShowLatest] = useState(false);
  const [showWithPhotos, setShowWithPhotos] = useState(false);
  const [reviewRole, setReviewRole] = useState<string>("All");
  const [reviewRating, setReviewRating] = useState<string>("All");

  // 获取当前用户信息
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        console.log("👤 Current user:", user?.username);
      } catch (error) {
        console.error("❌ Error loading current user:", error);
      }
    };

    loadCurrentUser();
  }, []);

  // ✅ 如果有 userId 但没有 username，先通过 userId 获取 username
  useEffect(() => {
    const loadUsernameFromId = async () => {
      if (userId && !usernameParam) {
        try {
          console.log("📖 Loading username for userId:", userId);
          // 通过 userId 获取用户信息
          const response = await userService.getUserById(userId);
          if (response?.username) {
            setUsername(response.username);
            console.log("✅ Username loaded:", response.username);
          }
        } catch (error) {
          console.error("❌ Error loading username from userId:", error);
        }
      }
    };

    loadUsernameFromId();
  }, [userId, usernameParam]);

  // 加载用户信息
  useEffect(() => {
    if (!username) return; // 等待 username 加载完成
    
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        console.log("📖 Loading user profile for:", username);
        
        const profile = await userService.getUserProfile(username);
        if (profile) {
          setUserProfile(profile);
          console.log("✅ User profile loaded:", profile.username);
          
          // 判断是否在查看自己的profile
          const isOwn = currentUser && currentUser.username === profile.username;
          setIsOwnProfile(isOwn);
          console.log("🔍 Is own profile:", isOwn);
        } else {
          Alert.alert("Error", "User not found");
          navigation.goBack();
        }
      } catch (error) {
        console.error("❌ Error loading user profile:", error);
        Alert.alert("Error", "Failed to load user profile");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [username, navigation, currentUser]);

  // 加载用户 listings
  useEffect(() => {
    const loadUserListings = async () => {
      if (!userProfile) return;
      
      try {
        setListingsLoading(true);
        console.log("📖 Loading listings for user:", userProfile.username);
        
        const listings = await userService.getUserListings(userProfile.username, 'active');
        setUserListings(listings);
        console.log(`✅ Loaded ${listings.length} listings`);
      } catch (error) {
        console.error("❌ Error loading user listings:", error);
        // 使用 mock 数据作为 fallback
        const mockListings = MOCK_LISTINGS.filter(
          (listing) => listing.seller.name.toLowerCase() === username.toLowerCase()
        );
        setUserListings(mockListings);
      } finally {
        setListingsLoading(false);
      }
    };

    loadUserListings();
  }, [userProfile, username]);

  // 加载用户喜欢的商品（查看自己的profile时加载自己的，查看别人的profile时加载公开的）
  useEffect(() => {
    const loadLikedListings = async () => {
      if (!userProfile) return;
      
      try {
        setLikesLoading(true);
        console.log("❤️ Loading liked listings for user:", userProfile.username);
        
        let liked: LikedListing[] = [];
        if (isOwnProfile) {
          // 查看自己的profile，加载自己的喜欢商品
          liked = await likesService.getLikedListings();
        } else {
          // 查看别人的profile，加载公开的喜欢商品
          liked = await likesService.getPublicLikedListings(userProfile.username);
        }
        
        setLikedListings(liked);
        console.log(`✅ Loaded ${liked.length} liked listings`);
      } catch (error) {
        console.error('Error loading liked listings:', error);
        setLikedListings([]); // 出错时设置为空数组
      } finally {
        setLikesLoading(false);
      }
    };

    loadLikedListings();
  }, [userProfile, username, isOwnProfile]);

  // 检查follow状态
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!userProfile || !currentUser || isOwnProfile) return;
      
      try {
        console.log("👥 Checking follow status for:", userProfile.username);
        const followStatus = await userService.checkFollowStatus(userProfile.username);
        setIsFollowing(followStatus);
        console.log(`✅ Follow status: ${followStatus}`);
      } catch (error) {
        console.error("❌ Error checking follow status:", error);
        // 如果检查失败，默认设为false
        setIsFollowing(false);
      }
    };

    checkFollowStatus();
  }, [userProfile, currentUser, isOwnProfile]);

  // 🔥 新增：加载用户的 reviews
  useEffect(() => {
    const loadUserReviews = async () => {
      if (!userProfile) return;
      
      try {
        setReviewsLoading(true);
        console.log("⭐ Loading reviews for user:", userProfile.username);
        
        const fetchedReviews = await userService.getUserReviews(userProfile.username);
        
        // 转换 API 数据格式以匹配 UI
        const formattedReviews = fetchedReviews.map((review) => ({
          id: `r-${review.id}`,
          name: review.reviewer.name,
          avatar: review.reviewer.avatar || "https://i.pravatar.cc/100?img=1",
          rating: review.rating,
          comment: review.comment || "",
          time: review.time,
          date: review.date,
          type: review.type as "buyer" | "seller",
          hasPhoto: review.hasPhoto || false,
        }));
        
        setReviews(formattedReviews);
        console.log(`✅ Loaded ${formattedReviews.length} reviews`);
      } catch (error) {
        console.error("❌ Error loading user reviews:", error);
        // 使用 mock 数据作为 fallback
        setReviews(mockReviews);
      } finally {
        setReviewsLoading(false);
      }
    };

    loadUserReviews();
  }, [userProfile]);

  // 使用真实的follow统计数据
  const followers = userProfile?.followersCount || 0;
  const following = userProfile?.followingCount || 0;
  const reviewsCount = reviews.length || userProfile?.reviewsCount || mockReviews.length;

  const mySizes = useMemo(() => {
    const sizes = [
      currentUser?.preferred_size_top,
      currentUser?.preferred_size_bottom,
      currentUser?.preferred_size_shoe,
    ]
      .filter((s): s is string => Boolean(s))
      .map((s) => String(s).trim().toUpperCase());
    return Array.from(new Set(sizes));
  }, [currentUser]);

  const filteredListings = useMemo(() => {
    let results = userListings;

    if (shopCategory !== "All") {
      results = results.filter((item) => item.category === shopCategory);
    }

    if (shopSize !== "All") {
      if (shopSize === "My Size") {
        if (mySizes.length > 0) {
          results = results.filter((item) =>
            mySizes.includes(String(item.size ?? "").trim().toUpperCase()),
          );
        }
        // If no preferred sizes, skip size filtering
      } else {
        const needle = String(shopSize).trim().toUpperCase();
        results = results.filter(
          (item) => String(item.size ?? "").trim().toUpperCase() === needle,
        );
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
  }, [userListings, shopCategory, shopSize, mySizes, shopCondition, shopSortBy]);

  const listingsData = useMemo(
    () => formatData(filteredListings, 3),
    [filteredListings]
  );

  const filteredReviews = useMemo(() => {
    // 🔥 使用真实的 reviews 数据，如果为空则使用 mock 数据
    const dataSource = reviews.length > 0 ? reviews : mockReviews;
    let results = dataSource;

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
  }, [reviews, reviewRole, reviewRating, showWithPhotos, showLatest]);

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

  // Follow/Unfollow 处理函数
  const handleFollowToggle = async () => {
    if (!userProfile) return;
    
    try {
      let newFollowStatus: boolean;
      
      if (isFollowing) {
        newFollowStatus = await userService.unfollowUser(userProfile.username);
      } else {
        newFollowStatus = await userService.followUser(userProfile.username);
      }
      
      setIsFollowing(newFollowStatus);
      console.log(`✅ Follow status updated: ${newFollowStatus}`);
    } catch (error) {
      console.error("❌ Error toggling follow status:", error);
      Alert.alert("Error", "Failed to update follow status");
    }
  };

  // Message 处理函数
  const handleMessageUser = async () => {
    console.log("🔍 UserProfile Message button pressed!");
    console.log("🔍 UserProfile:", userProfile);
    
    if (!userProfile) {
      console.log("❌ No userProfile found!");
      Alert.alert("Error", "Unable to find user information");
      return;
    }
    
    if (!userProfile.id) {
      console.log("❌ No user ID found!");
      Alert.alert("Error", "Unable to find user ID");
      return;
    }
    
    try {
      // 创建与用户的对话
      console.log("🔍 Creating conversation with user...");
      const conversation = await messagesService.createConversation({
        participant_id: parseInt(userProfile.id), // 🔥 修复：转换为数字
        type: 'GENERAL'
      });
      
      console.log("✅ Conversation created:", conversation);
      
      // 导航到聊天界面
      console.log("🔍 Navigating to ChatScreen...");
      
      // 🔥 使用 CommonActions 重置导航栈到正确状态
      const rootNavigation = (navigation as any).getParent?.();
      if (rootNavigation) {
        // 使用 CommonActions.reset 重置到 Main Tab 的 Inbox Stack
        rootNavigation.dispatch({
          type: 'RESET',
          payload: {
            index: 0,
            routes: [
              {
                name: 'Main',
                state: {
                  routes: [
                    { name: 'Home' },
                    { name: 'Discover' },
                    { name: 'Sell' },
                    {
                      name: 'Inbox',
                      state: {
                        routes: [
                          { name: 'InboxMain' },
                          {
                            name: 'Chat',
                            params: {
                              sender: userProfile.username,
                              kind: "general",
                              conversationId: conversation.id,
                              order: null
                            }
                          }
                        ],
                        index: 1
                      }
                    },
                    { name: 'My TOP' }
                  ],
                  index: 3
                }
              }
            ]
          }
        });
        
        console.log("✅ Navigation successful via RESET to Main Tab → Inbox Stack → Chat");
      } else {
        console.error("❌ Root navigation not available");
        Alert.alert("Navigation Error", "Unable to open chat. Please try again.");
      }
    } catch (error) {
      console.error("❌ Error creating conversation:", error);
      Alert.alert("Error", "Failed to start conversation. Please try again.");
    }
  };

  const shopActiveFiltersCount = useMemo(() => {
    let count = 0;
    if (shopCategory !== "All") count++;
    if (shopSize !== "All") count++;
    if (shopCondition !== "All") count++;
    if (shopSortBy !== "Latest") count++;
    return count;
  }, [shopCategory, shopSize, shopCondition, shopSortBy]);

  const tempShopActiveFiltersCount = useMemo(() => {
    let count = 0;
    if (tempShopCategory !== "All") count++;
    if (tempShopSize !== "All") count++;
    if (tempShopCondition !== "All") count++;
    if (tempShopSortBy !== "Latest") count++;
    return count;
  }, [tempShopCategory, tempShopSize, tempShopCondition, tempShopSortBy]);

  const reviewActiveFiltersCount = useMemo(() => {
    let count = 0;
    if (showLatest) count++;
    if (showWithPhotos) count++;
    if (reviewRole !== "All") count++;
    if (reviewRating !== "All") count++;
    return count;
  }, [showLatest, showWithPhotos, reviewRole, reviewRating]);

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <Header title={username} showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F54B3D" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  // 如果没有用户数据，显示错误
  if (!userProfile) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <Header title={username} showBack />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>User not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header 
        title={userProfile.username} 
        showBack 
        rightAction={
          <TouchableOpacity onPress={handleReport} style={styles.reportButton}>
            <Icon name="flag-outline" size={22} color="#111" />
          </TouchableOpacity>
        }
      />

      {/* Profile Section - Depop Style */}
      <View style={styles.profileSection}>
        {/* 头部：头像 + 右侧(名字/星星) */}
        <View style={styles.headerRow}>
          <Image 
            source={
              userProfile.avatar_url && typeof userProfile.avatar_url === 'string' && userProfile.avatar_url.startsWith('http')
                ? { uri: userProfile.avatar_url }
                : avatar && typeof avatar === 'string' && avatar.startsWith('http')
                ? { uri: avatar }
                : ASSETS.avatars.default
            } 
            style={styles.avatar} 
          />
          <View style={styles.nameCol}>
            <Text style={styles.shopName}>{userProfile.username}</Text>
            <View style={styles.locationRow}>
              <Icon name="location-outline" size={12} color="#666" />
              <Text style={styles.locationText}>Singapore</Text>
            </View>
            <View style={styles.starsRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon key={i} name="star" size={14} color="#FFB800" />
              ))}
            </View>
          </View>
        </View>

        {/* ↓↓↓ 这整块独立放在 headerRow 外面，才能和头像左边对齐 ↓↓↓ */}
        <View style={styles.belowBlock}>
          <View style={styles.activityItem}>
            <Icon name="flash" size={14} color="#007AFF" />
            <Text style={styles.activityText}>ACTIVE THIS WEEK</Text>
          </View>

          <View style={styles.activityItem}>
            <Icon name="diamond" size={14} color="#007AFF" />
            <Text style={styles.activityText}>{userProfile.soldListings} SOLD</Text>
          </View>

          {userProfile.bio && <Text style={styles.bioText}>{userProfile.bio}</Text>}

          <View style={styles.socialRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statNumber}>{followers}</Text>
              <Text style={styles.statLabel}>followers</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statNumber}>{following}</Text>
              <Text style={styles.statLabel}>following</Text>
            </View>

            {/* Follow和Message按钮 - 始终显示，但自己的profile时禁用 */}
            <TouchableOpacity
              style={[
                styles.followBtn, 
                isFollowing && styles.followBtnActive,
                isOwnProfile && styles.disabledBtn
              ]}
              onPress={isOwnProfile ? undefined : handleFollowToggle}
              disabled={isOwnProfile}
            >
              <Text style={[
                styles.followBtnText, 
                isFollowing && styles.followBtnTextActive,
                isOwnProfile && styles.disabledBtnText
              ]}>
                {isFollowing ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.msgBtn, isOwnProfile && styles.disabledBtn]} 
              onPress={isOwnProfile ? undefined : handleMessageUser}
              disabled={isOwnProfile}
            >
              <Icon 
                name="mail-outline" 
                size={24} 
                color={isOwnProfile ? "#999" : "#F54B3D"} 
              />
            </TouchableOpacity>
          </View>
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
              <Text style={styles.resultCount}>
                {listingsLoading ? "Loading..." : `${filteredListings.length} items`}
              </Text>
            </View>
            {listingsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#F54B3D" />
                <Text style={styles.loadingText}>Loading listings...</Text>
              </View>
            ) : filteredListings.length ? (
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
          likesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading liked items...</Text>
            </View>
          ) : likedListings.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="heart-outline" size={48} color="#bbb" />
              <Text style={styles.emptyTitle}>
                {isOwnProfile ? "No liked items yet" : "No public liked items"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {isOwnProfile 
                  ? "Items you like will appear here" 
                  : "This user hasn't liked any items yet"
                }
                    applyButtonLabel={`Apply Filters (${tempShopActiveFiltersCount})`}
              </Text>
            </View>
          ) : (
            <FlatList
              data={formatData(
                likedListings.map((likedListing) => ({
                  id: likedListing.id.toString(),
                  likedListing: likedListing,
                })),
                3
              )}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={styles.gridContent}
              renderItem={({ item }) =>
                item.empty || !item.likedListing ? (
                  <View style={[styles.gridItem, styles.gridItemInvisible]} />
                ) : (
                  <TouchableOpacity 
                    style={styles.gridItem}
                    onPress={() => {
                      const listing = item.likedListing.item;
                      
                      // 转换数据格式以匹配ListingDetailScreen的期望格式
                      const listingData = {
                        ...listing,
                        // seller数据已经是正确的格式，不需要转换
                      };
                      
                      navigation.navigate("ListingDetail", { item: listingData });
                    }}
                  >
                    <Image 
                      source={{ 
                        uri: item.likedListing?.item?.images?.[0] || 
                             'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop'
                      }} 
                      style={styles.gridImage} 
                    />
                    <View style={styles.likeBadge}>
                      <Icon name="heart" size={16} color="#f54b3d" />
                    </View>
                  </TouchableOpacity>
                )
              }
            />
          )
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
            options: tempShopSizeOptions.map((size) => ({
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
        applyButtonLabel={`Apply Filters (${tempShopActiveFiltersCount})`}
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
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#eee",
    marginRight: 12,
  },
  nameCol: {
    height: 70,
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 2,
    flexShrink: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    maxWidth: "100%",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
  },
  locationText: {
    fontSize: 12,
    color: "#666",
  },
  starsRow: {
    flexDirection: "row",
    columnGap: 2,
  },
  belowBlock: {
    marginTop: 6,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
    marginBottom: 6,
  },
  activityText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  bioText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginTop: 2,
    marginBottom: 10,
  },
  // Social Row (Depop-style)
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 18,
  },
  statBlock: {
    alignItems: "center",
    justifyContent: "center",
  },
  statNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  statLabel: {
    fontSize: 13,
    color: "#555",
  },
  followBtn: {
    backgroundColor: "#F54B3D",
    paddingVertical: 8,
    paddingHorizontal: 40,
    borderRadius: 6,
    minWidth: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  followBtnActive: {
    backgroundColor: "#999",
  },
  followBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  followBtnTextActive: {
    color: "#fff",
  },
  msgBtn: {
    width: 44,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  disabledBtn: {
    opacity: 0.5,
  },
  disabledBtnText: {
    color: "#999",
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

  // 新增样式
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
    textAlign: "center",
  },

});
