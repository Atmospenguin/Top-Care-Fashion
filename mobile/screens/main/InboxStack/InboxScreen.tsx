import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Modal,
  Pressable,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
// Keep SafeAreaView inside Header; avoid double SafeArea padding here
import Icon from "../../../components/Icon";
import Header from "../../../components/Header";
import ASSETS from "../../../constants/assetUrls";
import { messagesService, type Conversation } from "../../../src/services/messagesService";
import { useAuth } from "../../../contexts/AuthContext";

// 模拟多条对话（Support + Seller）
// added `unread` and `lastFrom` to support filtering
const mockThreads = [
  {
    id: "support-1",
    sender: "TOP Support",
    message: "Hey @ccc446981,",
    time: "1 month ago",
    avatar: ASSETS.avatars.top, // 红色 TOP PNG
    kind: "support",
    unread: false,
    lastFrom: "support",
  },
  {
    id: "order-2",
    sender: "seller111",
    message: "Leave a review for seller111",
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
      seller: { name: "seller111" },
      status: "Delivered",
    },
    unread: true,
    // last message came from the seller in this thread
    lastFrom: "seller",
  },
  {
    id: "order-3",
    sender: "buyer002",
    message: "I've completed my review",
    time: "Sep 26, 2025",
    avatar: { uri: "https://i.pravatar.cc/100?img=32" },
    kind: "order",
    order: {
      id: "2",
      product: {
        title: "Casual Beige Hoodie",
        price: 25,
        size: "L",
        image: "https://i5.walmartimages.com/asr/7aed82da-69af-46b8-854e-5c22d45a4df3.e7011d0ebdea1d9fabb68417c789ae16.jpeg",
      },
      seller: { name: "sellerCozy" },
      buyer: { name: "buyer002", avatar: "https://i.pravatar.cc/100?img=32" },
      status: "Completed",
    },
    unread: false,
    lastFrom: "buyer",
  },
];

export default function InboxScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user } = useAuth();
  
  // filter UI state (simple modal + selectedFilter)
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const anim = useRef(new Animated.Value(0)).current;
  const filtersArr = ["All", "Unread", "From seller", "From buyer"];

  // 加载真实对话数据
  useEffect(() => {
    loadConversations();
  }, []);

  // 添加焦点监听，每次返回时刷新数据
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log("🔍 InboxScreen focused, refreshing conversations...");
      loadConversations();
    });

    return unsubscribe;
  }, [navigation]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      console.log("🔍 Loading conversations from API...");
      
      const apiConversations = await messagesService.getConversations();
      setConversations(apiConversations);
      
      console.log("🔍 Loaded", apiConversations.length, "conversations from API");
      
    } catch (error) {
      console.error("❌ Error loading conversations:", error);
      // Fallback: 只显示 TOP Support 欢迎对话
      console.log("🔍 Falling back to TOP Support only");
      const topSupportConversation: Conversation = {
        id: "support-1",
        sender: "TOP Support",
        message: `Hey @${user?.username || 'user'}, Welcome to TOP! 👋`,
        time: "Just now",
        avatar: ASSETS.avatars.top,
        kind: "support",
        unread: false,
        lastFrom: "support",
        order: null
      };
      setConversations([topSupportConversation]);
    } finally {
      setIsLoading(false);
    }
  };

  // apply filters to the conversations
  useEffect(() => {
    if (filterVisible) {
      Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    } else {
      Animated.timing(anim, { toValue: 0, duration: 140, useNativeDriver: true }).start();
    }
  }, [filterVisible, anim]);

  const filteredThreads = useMemo(() => {
    if (selectedFilter === "All") return conversations;
    if (selectedFilter === "Unread") return conversations.filter((t) => t.unread);
    if (selectedFilter === "From seller") return conversations.filter((t) => t.lastFrom === "seller");
    if (selectedFilter === "From buyer") return conversations.filter((t) => t.lastFrom === "buyer");
    return conversations;
  }, [selectedFilter, conversations]);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* ✅ 统一用 Header 组件 */}
      <Header
        title="Inbox"
        rightAction={
          <View style={{ flexDirection: "row", columnGap: 16 }}>
            <TouchableOpacity accessibilityRole="button" onPress={() => setFilterVisible(true)}>
              <Icon name="filter-outline" size={24} color="#111" />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => navigation.navigate("Notification")}
            >
              <Icon name="notifications-outline" size={24} color="#111" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Custom modal dropdown (clean UI) */}
      <Modal transparent visible={filterVisible} animationType="none" onRequestClose={() => setFilterVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setFilterVisible(false)}>
          <Animated.View
            style={[
              styles.filterMenu,
              {
                opacity: anim,
                transform: [
                  {
                    translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }),
                  },
                ],
              },
            ]}
          >
            {filtersArr.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterItem, selectedFilter === f && styles.filterItemActive]}
                onPress={() => {
                  setSelectedFilter(f);
                  setFilterVisible(false);
                }}
              >
                <Text style={[styles.filterText, selectedFilter === f && styles.filterTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Message List */}
      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={filteredThreads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.messageRow}
            onPress={() =>
              navigation.navigate("Chat", {
                sender: item.sender,
                kind: item.kind,
                order: item.order ?? null,
                conversationId: item.id, // 传递 conversationId
              })
            }
          >
            {/* Avatar */}
            <Image 
              source={
                item.sender === "TOP Support" 
                  ? ASSETS.avatars.top 
                  : (item.avatar || ASSETS.avatars.default)
              } 
              style={styles.avatar} 
            />

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
  // modal filter styles
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.12)", justifyContent: "flex-start", alignItems: "flex-end" },
  filterMenu: { backgroundColor: "#fff", borderRadius: 12, marginTop: 56, marginRight: 12, paddingVertical: 8, width: 160, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  filterItem: { paddingVertical: 10, paddingHorizontal: 16 },
  filterItemActive: { backgroundColor: "#F2F2F2" },
  filterText: { fontSize: 15, color: "#111" },
  filterTextActive: { color: "#F54B3D", fontWeight: "700" },
});
