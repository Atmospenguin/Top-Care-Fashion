import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";

const filterIcon = require("../../../assets/icon-filter.png");
const bellIcon = require("../../../assets/icon-settings.png"); // 临时用 settings 图标代替通知

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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Inbox</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity>
            <Image source={filterIcon} style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Image source={bellIcon} style={styles.icon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Message List */}
      <FlatList
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: "700" },
  headerActions: { flexDirection: "row", columnGap: 16 },
  icon: { width: 22, height: 22 },

  // Messages
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
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
