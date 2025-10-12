import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import type { BuyStackParamList } from "./index";
import type { HomeStackParamList } from "../HomeStack";

const MAX_CHARACTERS = 300;

export default function ReviewScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<BuyStackParamList>>();
  const {
    params: { orderId, itemTitle, sellerName },
  } = useRoute<RouteProp<BuyStackParamList, "Review">>();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    Alert.alert("Review submitted", "Thanks for reviewing your order.", [
      {
        text: "Done",
        onPress: () =>
          navigation
            .getParent<NativeStackNavigationProp<HomeStackParamList>>()
            ?.navigate("HomeMain"),
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <Header title="Leave a review" showBack />

      <View style={styles.container}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>Order {orderId}</Text>
          <Text style={styles.itemTitle}>{itemTitle}</Text>
          <Text style={styles.sellerName}>Sold by {sellerName}</Text>
        </View>

        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((value) => (
            <TouchableOpacity
              key={value}
              onPress={() => setRating(value)}
              accessibilityRole="button"
            >
              <Icon
                name={value <= rating ? "star" : "star-outline"}
                size={32}
                color={value <= rating ? "#FFC107" : "#ccc"}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Share your thoughts</Text>
        <TextInput
          style={styles.textArea}
          multiline
          maxLength={MAX_CHARACTERS}
          placeholder="Tell other shoppers about fit, quality, and your experience"
          placeholderTextColor="#999"
          value={comment}
          onChangeText={setComment}
        />
        <Text style={styles.counter}>{comment.length}/{MAX_CHARACTERS}</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
          <Text style={styles.primaryText}>Submit review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: {
    flex: 1,
    padding: 20,
    rowGap: 20,
  },
  orderInfo: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eee",
    padding: 16,
    rowGap: 6,
    backgroundColor: "#fafafa",
  },
  orderId: { fontSize: 13, color: "#666" },
  itemTitle: { fontSize: 16, fontWeight: "700" },
  sellerName: { fontSize: 14, color: "#444" },
  ratingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  label: { fontSize: 14, fontWeight: "600" },
  textArea: {
    minHeight: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 16,
    textAlignVertical: "top",
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: "#fff",
  },
  counter: {
    alignSelf: "flex-end",
    fontSize: 12,
    color: "#777",
  },
  primaryButton: {
    marginTop: "auto",
    backgroundColor: "#111",
    borderRadius: 28,
    alignItems: "center",
    paddingVertical: 16,
  },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
