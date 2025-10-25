import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";

import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import type { RootStackParamList } from "../../../App";
import { reviewsService } from "../../../src/services";

type ReviewSide = {
  name: string;
  avatar: string;
  role: "Buyer" | "Seller";
  rating: number;
  comment: string;
};

const mockMutualReviews: Record<string, { buyer: ReviewSide; seller: ReviewSide }> =
  {
    "2": {
      buyer: {
        name: "buyer002",
        avatar: "https://i.pravatar.cc/100?img=32",
        role: "Buyer",
        rating: 5,
        comment:
          "Excellent quality! The Casual Beige Hoodie is even more comfortable than I expected. Perfect fit and fast delivery!",
      },
      seller: {
        name: "sellerCozy",
        avatar: "https://i.pravatar.cc/100?img=22",
        role: "Seller",
        rating: 5,
        comment:
          "Great buyer! Very smooth transaction and quick payment. Would be happy to work with again.",
      },
    },
  };

export default function MutualReviewScreen() {
  const {
    params: { orderId },
  } = useRoute<RouteProp<RootStackParamList, "MutualReview">>();

  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 🔥 加载评论数据
  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        const reviewsData = await reviewsService.getOrderReviews(parseInt(orderId));
        setReviews(reviewsData);
      } catch (error) {
        console.error("Error loading reviews:", error);
        setError("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [orderId]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <Header title="Mutual Review" showBack />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <Header title="Mutual Review" showBack />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  // 🔥 转换数据格式
  const buyerReview = reviews.find(r => r.reviewer.role === "buyer" || r.reviewer_id === reviews[0]?.order?.buyer_id);
  const sellerReview = reviews.find(r => r.reviewer.role === "seller" || r.reviewer_id === reviews[0]?.order?.seller_id);

  const mutualReviews = buyerReview && sellerReview ? {
    buyer: {
      name: buyerReview.reviewer.username,
      avatar: buyerReview.reviewer.avatar_url || buyerReview.reviewer.avatar_path || "https://via.placeholder.com/44x44",
      role: "Buyer" as const,
      rating: buyerReview.rating,
      comment: buyerReview.comment || "",
    },
    seller: {
      name: sellerReview.reviewer.username,
      avatar: sellerReview.reviewer.avatar_url || sellerReview.reviewer.avatar_path || "https://via.placeholder.com/44x44",
      role: "Seller" as const,
      rating: sellerReview.rating,
      comment: sellerReview.comment || "",
    }
  } : null;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title="Mutual Review" showBack />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.summary}>
          <Icon name="swap-vertical" size={18} color="#2d7ef0" />
          <Text style={styles.summaryText}>
            Order {orderId}: both reviews are now visible to each other.
          </Text>
        </View>

        {mutualReviews ? (
          <>
            <ReviewCard side={mutualReviews.buyer} />
            <ReviewCard side={mutualReviews.seller} />
          </>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="chatbubble-ellipses-outline" size={36} color="#c2c7d1" />
            <Text style={styles.emptyTitle}>No mutual review yet</Text>
            <Text style={styles.emptyText}>
              Once both parties submit their reviews, they will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ReviewCard({ side }: { side: ReviewSide }) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Image source={{ uri: side.avatar }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{side.name}</Text>
          <Text style={styles.role}>{side.role}</Text>
        </View>
        <View style={styles.ratingRow}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Icon
              key={`${side.name}-star-${index}`}
              name={index < side.rating ? "star" : "star-outline"}
              size={14}
              color="#f5a623"
            />
          ))}
        </View>
      </View>
      <Text style={styles.comment}>{side.comment}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 120,
    rowGap: 16,
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 10,
    backgroundColor: "#f5f8ff",
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#d9e4ff",
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
    color: "#2b3c66",
    lineHeight: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e5e5",
    backgroundColor: "#fff",
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    rowGap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  name: { fontSize: 16, fontWeight: "700", color: "#111" },
  role: { fontSize: 12, color: "#666", marginTop: 2 },
  ratingRow: {
    flexDirection: "row",
    columnGap: 2,
  },
  comment: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    rowGap: 10,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  emptyText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 24,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
  },
});
