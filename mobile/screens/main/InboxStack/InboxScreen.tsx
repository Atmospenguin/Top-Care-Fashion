import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
// Keep SafeAreaView inside Header; avoid double SafeArea padding here
import Icon from "../../../components/Icon";
import Header from "../../../components/Header";

// 模拟一条消息
const mockMessages = [
  {
    id: "1",
    sender: "TOP Support",
    message: "Hey @ccc446981,",
    time: "1 month ago",
    avatarText: "TOP",
  },
];

export default function InboxScreen() {
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
        data={mockMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.messageRow}>
            {/* Avatar */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.avatarText}</Text>
            </View>
            {/* Texts */}
            <View style={styles.messageText}>
              <Text style={styles.sender}>{item.sender}</Text>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Messages
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    // removed borderBottom to avoid gray separator line between messages
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F54B3D",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { color: "#fff", fontWeight: "700" },
  messageText: { flex: 1 },
  sender: { fontWeight: "700", fontSize: 16, marginBottom: 2 },
  message: { fontSize: 14, color: "#333" },
  time: { fontSize: 12, color: "#888", marginTop: 2 },
});
