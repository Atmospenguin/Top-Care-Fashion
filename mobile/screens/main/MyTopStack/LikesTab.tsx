import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import Icon from "../../../components/Icon";
import { likesService, LikedListing } from "../../../src/services";
import { useNavigation } from "@react-navigation/native";

// 保证三列对齐
function formatData(data: any[], numColumns: number) {
  const numberOfFullRows = Math.floor(data.length / numColumns);
  let numberOfElementsLastRow = data.length - numberOfFullRows * numColumns;

  while (
    numberOfElementsLastRow !== numColumns &&
    numberOfElementsLastRow !== 0
  ) {
    data.push({ id: `blank-${numberOfElementsLastRow}`, empty: true });
    numberOfElementsLastRow++;
  }
  return data;
}

export default function LikesTab() {
  const navigation = useNavigation();
  const [likedListings, setLikedListings] = useState<LikedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLikedListings();
  }, []);

  const loadLikedListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await likesService.getLikedListings();
      setLikedListings(data);
    } catch (err) {
      console.error('Error loading liked listings:', err);
      setError('Failed to load liked listings');
    } finally {
      setLoading(false);
    }
  };

  const handleItemPress = (likedListing: LikedListing) => {
    // 调试：查看原始数据
    console.log('🔍 Debug - Original likedListing:', likedListing);
    console.log('🔍 Debug - Original seller:', likedListing.listing.seller);
    
    // 导航到ListingDetailScreen
    const rootNavigation = navigation
      .getParent()
      ?.getParent() as any;
    
    // 处理图片数据 - 转换为ListingDetailScreen期望的格式
    let images = [];
    if (likedListing.listing?.image_url) {
      images = [likedListing.listing.image_url];
    } else if (likedListing.listing?.image_urls) {
      try {
        const imageUrls = typeof likedListing.listing.image_urls === 'string' 
          ? JSON.parse(likedListing.listing.image_urls) 
          : likedListing.listing.image_urls;
        images = Array.isArray(imageUrls) ? imageUrls : [];
      } catch (e) {
        console.log('Error parsing image_urls:', e);
        images = [];
      }
    }
    
    // 处理tags数据
    let tags = [];
    if (likedListing.listing?.tags) {
      try {
        tags = typeof likedListing.listing.tags === 'string' 
          ? JSON.parse(likedListing.listing.tags) 
          : likedListing.listing.tags;
        if (!Array.isArray(tags)) {
          tags = [];
        }
      } catch (e) {
        console.log('Error parsing tags:', e);
        tags = [];
      }
    }
    
    // 转换数据格式以匹配ListingDetailScreen的期望格式
    const listingData = {
      ...likedListing.listing,
      title: likedListing.listing?.name, // 将name转换为title
      images: images, // 添加images数组
      tags: tags, // 添加tags数组
      seller: {
        ...likedListing.listing?.seller,
        name: likedListing.listing?.seller?.username, // 将username转换为name
        avatar: likedListing.listing?.seller?.avatar_url, // 将avatar_url转换为avatar
        // 保留id字段用于用户身份验证
      },
    };
    
    // 调试：查看转换后的数据
    console.log('🔍 Debug - Converted listingData:', listingData);
    console.log('🔍 Debug - Converted seller:', listingData.seller);
    
    rootNavigation?.navigate("Buy", {
      screen: "ListingDetail",
      params: { item: listingData },
    });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyText}>
        You haven't liked anything yet.{"\n"}Start exploring and heart the items you love!
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: any }) => {
    if (item.empty) {
      return <View style={[styles.item, styles.itemInvisible]} />;
    }

    const likedListing = item as LikedListing;
    const listing = likedListing.listing;
    
    // 处理图片URL - image_urls可能是JSON字符串
    let firstImage = listing?.image_url;
    if (!firstImage && listing?.image_urls) {
      try {
        const imageUrls = typeof listing.image_urls === 'string' 
          ? JSON.parse(listing.image_urls) 
          : listing.image_urls;
        firstImage = Array.isArray(imageUrls) ? imageUrls[0] : undefined;
      } catch (e) {
        console.log('Error parsing image_urls:', e);
        firstImage = undefined;
      }
    }
    
    // 确保有有效的图片URL
    const imageUri = firstImage && firstImage.trim() !== '' ? firstImage : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop';


    return (
      <TouchableOpacity 
        style={styles.item}
        onPress={() => handleItemPress(likedListing)}
        activeOpacity={0.8}
      >
        <Image 
          source={{ uri: imageUri }} 
          style={styles.image} 
          onError={() => console.log('Image failed to load:', imageUri)}
        />
        {/* ❤️ 喜欢标记 */}
        <View style={styles.heartIcon}>
          <Icon name="heart" size={20} color="#F54B3D" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading your likes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadLikedListings}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (likedListings.length === 0) {
    return renderEmptyState();
  }


  return (
    <View style={{ flex: 1 }}>
      {/* 图片网格 */}
      <FlatList
        data={formatData([...likedListings], 3)}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    margin: 2,
    aspectRatio: 1,
    position: "relative",
  },
  itemInvisible: {
    backgroundColor: "transparent",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
  },
  heartIcon: {
    position: "absolute",
    right: 6,
    bottom: 6,
  },
  // 新增样式
  listContainer: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyBox: {
    marginTop: 10,
    marginHorizontal: 16,
    backgroundColor: "#E6F0FF",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  emptyText: { 
    textAlign: "center", 
    color: "#555",
    fontSize: 16,
    lineHeight: 22,
  },
});
