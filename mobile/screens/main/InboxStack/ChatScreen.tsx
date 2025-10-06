import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Icon from "../../../components/Icon";
import Header from "../../../components/Header";
import ASSETS from "../../../constants/assetUrls";

export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { sender } = route.params || { sender: "TOP Support" };

  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: "other",
      message: "Hey @ccc446981, Welcome to TOP! 👋",
      time: "Jul 13, 2025 18:17",
    },
    {
      id: "2",
      sender: "me",
      message: "Thanks! Happy to join ~",
      time: "Jul 13, 2025 18:20",
    },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: "me", message: input, time: "Now" },
    ]);
    setInput("");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header：红底 + SafeArea */}
      <Header
        title={sender}
        showBack
        bgColor="#F54B3D"
        textColor="#fff"
        iconColor="#fff"
        rightAction={<View style={{ width: 26 }} />} // 占位保持标题居中
      />

      {/* Message List */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 12 }}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 12 }}>
            {/* 时间戳 */}
            <Text style={styles.time}>{item.time}</Text>

            <View
              style={[
                styles.messageRow,
                item.sender === "me" && { justifyContent: "flex-end" },
              ]}
            >
              {/* 左侧头像（对方头像） */}
              {item.sender !== "me" && (
                <Image
                  source={ASSETS.avatars.top}   // ✅ PNG 版本
                  style={styles.avatar}
                />
              )}

              {/* 气泡 */}
              <View
                style={item.sender === "me" ? styles.bubbleRight : styles.bubbleLeft}
              >
                <Text style={item.sender === "me" ? styles.textRight : styles.textLeft}>
                  {item.message}
                </Text>
              </View>

              {/* 右侧头像（自己头像） */}
              {item.sender === "me" && (
                <Image
                  source={ASSETS.avatars.default}
                  style={[styles.avatar, { marginLeft: 6 }]}
                />
              )}
            </View>
          </View>
        )}
      />

      {/* 输入框 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
            <Icon name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 6,
  },
 messageRow: { flexDirection: "row", alignItems: "flex-end" },
bubbleLeft: {
  backgroundColor: "#eee",
  paddingVertical: 10,
  paddingHorizontal: 14,
  borderRadius: 20,   // ✅ 圆角
  maxWidth: "70%",
},
bubbleRight: {
  backgroundColor: "#007AFF",
  paddingVertical: 10,
  paddingHorizontal: 14,
  borderRadius: 20,   // ✅ 圆角
  maxWidth: "70%",
  

  },
  textLeft: { color: "#000", fontSize: 15 },
  textRight: { color: "#fff", fontSize: 15 },
  time: {
    fontSize: 11,
    color: "#888",
    alignSelf: "center",
    marginBottom: 4,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
    backgroundColor: "#fff",
  },
  textInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    fontSize: 15,
    marginRight: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
});
