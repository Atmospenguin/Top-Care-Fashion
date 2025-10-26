import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import Header from "../../../components/Header";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../../App";
import { Ionicons } from "@expo/vector-icons";
import { reviewsService, ordersService } from "../../../src/services";

export default function ReviewScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "Review">>();
  const { orderId, reviewType } = route.params;

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [reviewee, setReviewee] = useState<any>(null);

  // 🔥 加载订单和用户信息
  useEffect(() => {
    const loadOrderData = async () => {
      try {
        setLoading(true);
        const orderData = await ordersService.getOrder(parseInt(orderId));
        setOrder(orderData);
        
        // 确定被评论的用户（买家评论卖家，卖家评论买家）
        const currentUserId = orderData.buyer_id; // 这里需要从 auth 获取当前用户ID
        const revieweeData = orderData.buyer_id === currentUserId ? orderData.seller : orderData.buyer;
        setReviewee(revieweeData);
      } catch (error) {
        console.error("Error loading order data:", error);
        Alert.alert("Error", "Failed to load order data");
      } finally {
        setLoading(false);
      }
    };

    loadOrderData();
  }, [orderId]);

  // 🔥 提交评论
  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert("Error", "Please select a rating");
      return;
    }

    try {
      setSubmitting(true);
      await reviewsService.createReview(parseInt(orderId), {
        rating,
        comment: review.trim() || undefined
      });
      
      Alert.alert("Success", "Review submitted successfully!", [
        { text: "OK", onPress: () => {
          // 返回上一页
          const navigation = route.params as any;
          if (navigation?.goBack) {
            navigation.goBack();
          }
        }}
      ]);
    } catch (error) {
      console.error("Error submitting review:", error);
      Alert.alert("Error", "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <Header title="Leave Review" showBack />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!order || !reviewee) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <Header title="Leave Review" showBack />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load order data</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header (内部已经有 SafeArea) */}
      <Header title="Leave Review" showBack />

      <ScrollView contentContainerStyle={styles.container}>
        {/* 用户信息 */}
        <View style={styles.userSection}>
          <Image 
            source={{ 
              uri: reviewee.avatar_url || reviewee.avatar_path || "https://via.placeholder.com/60x60" 
            }} 
            style={styles.avatar} 
          />
          <Text style={styles.userName}>{reviewee.username}</Text>
        </View>

        {/* 星星评分 */}
        <View style={styles.ratingSection}>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity key={i} onPress={() => setRating(i)}>
                <Ionicons
                  name={i <= rating ? "star" : "star-outline"}
                  size={32}
                  color={i <= rating ? "#FFD700" : "#ccc"}
                  style={{ marginHorizontal: 4 }}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.subText}>
            Tap on a star to rate your experience with this user
          </Text>
        </View>

        {/* 评论框 */}
        <Text style={styles.label}>REVIEW</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe your experience with the product and the seller/buyer"
          placeholderTextColor="#999"
          value={review}
          onChangeText={setReview}
          multiline
          maxLength={300}
        />
        <Text style={styles.counter}>{review.length}/300</Text>

        {/* 上传图片 (只有相机 icon) */}
        <View style={styles.uploadRow}>
          {[1, 2, 3].map((i) => (
            <TouchableOpacity key={i} style={styles.uploadBox}>
              <Ionicons name="camera-outline" size={28} color="#555" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 固定底部按钮 */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.sendBtn, submitting && styles.sendBtnDisabled]}
          onPress={handleSubmitReview}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 120,
  },
  userSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, marginBottom: 8 },
  userName: { fontSize: 16, fontWeight: "600", color: "#333" },
  ratingSection: { alignItems: "center", marginBottom: 20 },
  starRow: { flexDirection: "row", marginBottom: 8 },
  subText: { fontSize: 13, color: "#888", textAlign: "center" },
  label: { fontSize: 15, fontWeight: "700", marginBottom: 8 },
  textArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
  },
  counter: { textAlign: "right", fontSize: 12, color: "#999", marginTop: 4 },
  uploadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  uploadBox: {
    width: 90,
    height: 90,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingBottom: 40,
  },
  sendBtn: {
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  sendText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  sendBtnDisabled: { backgroundColor: "#ccc" },
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
