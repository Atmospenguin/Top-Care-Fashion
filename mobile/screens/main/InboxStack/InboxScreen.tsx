import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
// Keep SafeAreaView inside Header; avoid double SafeArea padding here
import Icon from "../../../components/Icon";
import Header from "../../../components/Header";
import ASSETS from "../../../constants/assetUrls";

// 模拟多条对话（Support + Seller）
const mockThreads = [
  {
    id: "support-1",
    sender: "TOP Support",
    message: "Hey @ccc446981,",
    time: "1 month ago",
    avatar: ASSETS.avatars.top, // 红色 TOP PNG
    kind: "support",
  },
  {
    id: "order-2",
    sender: "seller111",
    message: "Order delivered — leave a review",
    time: "Sep 25, 2025",
    avatar: { uri: "https://i.pravatar.cc/100?img=12" }, // seller111 专用头像
    kind: "order",
    order: {
      id: "ORD123",
      product: {
        title: "American Eagle Super Stretch Skinny Jeans",
        price: 10,
        image:
          "https://tse4.mm.bing.net/th/id/OIP.TC_mOkLd6sQzsLiE_uSloQHaJ3?w=600&h=799&rs=1&pid=ImgDetMain",
      },
      seller: "seller111",
      status: "Delivered",
    },
  },
];

export default function InboxScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* ✅ 统一用 Header 组件 */}
      <Header
          title="Inbox"
        rightAction={
          <View style={{ flexDirection: "row", columnGap: 16 }}>
            <TouchableOpacity accessibilityRole="button">
              <Icon name="filter-outline" size={24} color="#111" />
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button">
              <Icon name="notifications-outline" size={24} color="#111" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Message List */}
      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={mockThreads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.messageRow}
            onPress={() =>
              navigation.navigate("Chat", {
                sender: item.sender,
                kind: item.kind,
                order: item.order ?? null,
              })
            }
          >
            {/* Avatar */}
            <Image source={item.avatar} style={styles.avatar} />

            {/* Texts */}
            <View style={styles.messageText}>
              <Text style={styles.sender}>{item.sender}</Text>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24, // ✅ 圆形头像
    marginRight: 12,
  },
  messageText: { flex: 1 },
  sender: { fontWeight: "700", fontSize: 16, marginBottom: 2 },
  message: { fontSize: 14, color: "#333" },
  time: { fontSize: 12, color: "#888", marginTop: 2 },
});
