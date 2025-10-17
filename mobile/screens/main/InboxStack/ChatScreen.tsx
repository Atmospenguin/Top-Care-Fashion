import React, { useEffect, useMemo, useRef, useState } from "react";
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
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { InboxStackParamList } from "./InboxStackNavigator";
import Icon from "../../../components/Icon";
import Header from "../../../components/Header";
import ASSETS from "../../../constants/assetUrls";

type Order = {
  id: string;
  product: { title: string; price: number; size?: string; image: string };
  seller: { name: string; avatar?: string };
  buyer?: { name: string; avatar?: string };
  status: "Delivered" | "Shipped" | "Processing" | string;
  address?: { name?: string; phone?: string; detail?: string };
  payment?: { method?: string; amount?: number; date?: string; transactionId?: string };
  feedbackGiven?: boolean;
};

type ChatItem =
  | { id: string; type: "msg"; sender: "me" | "other"; text: string; time?: string }
  | {
      id: string;
      type: "system";
      text: string;
      time?: string;
      sentByUser?: boolean;
      avatar?: string;
      orderId?: string;
    }
  | { id: string; type: "orderCard"; order: Order }
  | { id: string; type: "reviewCta"; text: string; orderId: string };

export default function ChatScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<InboxStackParamList, "Chat">>();
  const route = useRoute<any>();
  const { sender = "TOP Support", kind = "support", order = null } = route.params || {};

  // —— 初始消息：按会话类型分支 —— //
  const itemsInit: ChatItem[] = useMemo(() => {
    if (kind === "order" && order) {
      const o: Order = {
        ...order,
        seller: {
          name: order?.seller?.name ?? "seller111",
          avatar: order?.seller?.avatar ?? "https://i.pravatar.cc/100?img=12",
        },
        buyer: {
          name: "buyer002",
          avatar: "https://i.pravatar.cc/100?img=32",
        },
        status: order?.status ?? "Completed",
      };

      if (sender === "seller111") {
        return [
          { id: "t0", type: "system", text: "Sep 20, 2025 18:30" },
          { id: "card0", type: "orderCard", order: o },
          { id: "t1", type: "system", text: "Sep 20, 2025 18:32" },
          { id: "m1", type: "msg", sender: "me", text: "Hi! Is this jeans still available?" },
          { id: "m2", type: "msg", sender: "other", text: "Yes! It’s in good condition and ready to ship 😊" },
          { id: "t2", type: "system", text: "Sep 20, 2025 18:36" },
          { id: "m3", type: "msg", sender: "me", text: "Great! I’ll place the order now." },
          {
            id: "sysPay",
            type: "system",
            text: "I've paid, waiting for you to ship\nPlease pack the item and ship to the address I provided on TOP.",
            sentByUser: true,
          },
          { id: "sys1", type: "system", text: "Seller has shipped your parcel.", time: "Sep 20, 2025 18:37" },
          { id: "sys2", type: "system", text: "Parcel is in transit.", time: "Sep 23, 2025 13:40" },
          {
            id: "sys3",
            type: "system",
            text: "Parcel arrived. Waiting for buyer to confirm received.",
            time: "Sep 24, 2025 08:00",
          },
          {
            id: "sys4",
            type: "system",
            text: "Order confirmed received. Transaction completed.",
            time: "Sep 25, 2025 12:50",
          },
          {
            id: "cta1",
            type: "reviewCta",
            text: "How was your experience? Leave a review to help others discover great items.",
            orderId: o.id,
          },
        ];
      }

      if (sender === "buyer002") {
        return [
          { id: "t0", type: "system", text: "Sep 26, 2025 15:00" },
          { id: "card0", type: "orderCard", order: o },
          {
            id: "cardPay",
            type: "system",
            text: "buyer002 has paid for the order.\nPlease prepare the package and ship soon.",
            sentByUser: false,
            avatar: o.buyer?.avatar,
          },
          { id: "m1", type: "msg", sender: "me", text: "Ok, I’ll ship the hoodie in 3 days." },
          {
            id: "sys2",
            type: "system",
            text: "You’ve marked the order as shipped.",
            time: "Sep 28, 2025 10:00",
          },
          {
            id: "sys3",
            type: "system",
            text: "Buyer has confirmed received. Transaction completed.",
            time: "Sep 30, 2025 16:00",
          },
          {
            id: "cardReviewBuyer",
            type: "system",
            text: "I’ve completed my review\nWaiting for your review.",
            sentByUser: false,
            avatar: o.buyer?.avatar,
          },
          {
            id: "cardReviewSeller",
            type: "system",
            text: "I’ve completed my review\nMutual reviews are done. You can view them now.",
            sentByUser: true,
            orderId: o.id,
          },
        ];
      }
    }

    // TOP Support 会话（保留原来两条）
    return [
      { id: "1", type: "msg", sender: "other", text: "Hey @ccc446981, Welcome to TOP! 👋", time: "Jul 13, 2025 18:17" },
      { id: "2", type: "msg", sender: "me", text: "Thanks! Happy to join ~", time: "Jul 13, 2025 18:20" },
    ];
  }, [kind, order, sender]);

  const listRef = useRef<FlatList<ChatItem>>(null);
  const [items, setItems] = useState<ChatItem[]>(itemsInit);
  const [input, setInput] = useState("");

  useEffect(() => {
    const id = setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!items.length) return;
    const id = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(id);
  }, [items]);

  const sendMessage = () => {
    if (!input.trim()) return;
    setItems((prev) => [
      ...prev,
      { id: String(Date.now()), type: "msg", sender: "me", text: input, time: "Now" },
    ]);
    setInput("");
  };

  // —— UI 组件 —— //
  const renderOrderCard = (o: Order) => (
    <View style={styles.orderCard}>
      <Image source={{ uri: o.product.image }} style={styles.orderThumb} />
      <View style={{ flex: 1 }}>
        <Text style={styles.orderTitle} numberOfLines={2}>
          {o.product.title}
        </Text>
        <Text style={styles.orderPrice}>
          ${o.product.price}
          {o.product.size ? ` · Size ${o.product.size}` : ""}
        </Text>
        <Text style={styles.orderMeta}>
          {sender === "buyer002"
            ? `Purchased by ${o?.buyer?.name ?? "Buyer"}`
            : `Sold by ${o?.seller?.name ?? "Seller"}`}
        </Text>
        <Text style={styles.orderStatus}>Status: {o.status}</Text>
      </View>
    </View>
  );

  type SystemItem = Extract<ChatItem, { type: "system" }>;

  const renderSystem = (item: SystemItem) => {
    const { id, text, time, sentByUser, avatar } = item;
    // 判断是不是时间格式（更严格）：匹配像 "Sep 20, 2025" 或 "Jul 13, 2025" 的开头
    const isDateLike = /^\w{3}\s\d{1,2},\s\d{4}/.test(text);

    if (isDateLike) {
      // 只显示居中时间文字（无灰底）
      return <Text style={styles.timeOnly}>{text}</Text>;
    }

    // 如果文本包含换行，渲染为系统卡片（两行：标题 + 副标题）
    if (text.includes("\n")) {
      const [title, ...rest] = text.split("\n");
      const subtitle = rest.join("\n");
      const isMine = Boolean(sentByUser);

      const bubbleStyle = isMine ? styles.userCardBubble : styles.userCardBubbleBuyer;
      const avatarSource = isMine
        ? ASSETS.avatars.default
        : avatar
        ? { uri: avatar }
        : ASSETS.avatars.default;

      return (
        <>
          {time ? <Text style={styles.time}>{time}</Text> : null}
          <View style={[styles.messageRow, isMine ? { justifyContent: "flex-end" } : undefined]}>
            {!isMine && <Image source={avatarSource} style={[styles.avatar, { marginRight: 6 }]} />}

            <View style={bubbleStyle}>
              {title ? <Text style={styles.userCardTitle}>{title}</Text> : null}
              <View style={styles.userCardDivider} />
              {subtitle ? <Text style={styles.userCardSubtitle}>{subtitle}</Text> : null}

              {id === "cardReviewBuyer" && (
                <TouchableOpacity style={styles.userCardBtn} disabled>
                  <Text style={styles.userCardBtnText}>Reviewed</Text>
                </TouchableOpacity>
              )}

              {id === "cardReviewSeller" && (
                <TouchableOpacity
                  style={styles.userCardBtn}
                  onPress={() => {
                    if (item.orderId) {
                      (navigation as any).navigate("MutualReview", { orderId: item.orderId });
                    }
                  }}
                >
                  <Text style={styles.userCardBtnText}>View mutual review</Text>
                </TouchableOpacity>
              )}
            </View>

            {isMine && <Image source={ASSETS.avatars.default} style={[styles.avatar, { marginLeft: 6 }]} />}
          </View>
        </>
      );
    }

    // 其他系统提示（物流状态等）维持灰框样式
    return (
      <>
        {time ? <Text style={styles.time}>{time}</Text> : null}
        <View style={styles.systemBox}>
          <Text style={styles.systemText}>{text}</Text>
        </View>
      </>
    );
  };

  const renderReviewCTA = (orderId: string, text: string) => (
    <View style={styles.reviewBox}>
      {/* 只保留这段提示文字 */}
      <Text style={styles.reviewHint}>{text}</Text>
      {/* 居中按钮 */}
  <TouchableOpacity
    style={styles.reviewBtnCenter}
    onPress={() => (navigation as any).navigate("Review", { orderId })}
  >
    <Text style={styles.reviewBtnText}>Leave Review</Text>
  </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header
        title={sender}
        showBack
        bgColor="#F54B3D"
        textColor="#fff"
        iconColor="#fff"
        rightAction={<View style={{ width: 26 }} />}
      />

      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 12 }}
        renderItem={({ item }) => {
          if (item.type === "orderCard") return <View style={{ marginBottom: 12 }}>{renderOrderCard(item.order)}</View>;
          if (item.type === "system")
            return <View style={{ marginBottom: 12 }}>{renderSystem(item)}</View>;
          if (item.type === "reviewCta")
            return <View style={{ marginBottom: 12 }}>{renderReviewCTA(item.orderId, item.text)}</View>;

          // 普通消息
          return (
            <View style={{ marginBottom: 12 }}>
              {item.time ? <Text style={styles.time}>{item.time}</Text> : null}
              <View style={[styles.messageRow, item.sender === "me" && { justifyContent: "flex-end" }]}>
                {/* 对方头像：TOP Support 用 TOP 头像；否则用默认 */}
                {item.sender !== "me" && (
                  <Image
                    source={
                      sender === "TOP Support"
                        ? ASSETS.avatars.top
                        : sender === "seller111"
                        ? { uri: "https://i.pravatar.cc/100?img=12" }
                        : ASSETS.avatars.default
                    }
                    style={[styles.avatar, { marginRight: 6 }]}
                  />
                )}

                <View style={item.sender === "me" ? styles.bubbleRight : styles.bubbleLeft}>
                  <Text style={item.sender === "me" ? styles.textRight : styles.textLeft}>{item.text}</Text>
                </View>

                {/* 自己头像：始终用默认头像（修复右侧被换成 TOP 的问题） */}
                {item.sender === "me" && (
                  <Image source={ASSETS.avatars.default} style={[styles.avatar, { marginLeft: 6 }]} />
                )}
              </View>
            </View>
          );
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
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
  // avatars & bubbles
  avatar: { width: 32, height: 32, borderRadius: 16 },
  messageRow: { flexDirection: "row", alignItems: "flex-start" },
  bubbleLeft: {
    backgroundColor: "#eee",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginHorizontal: 6,
    maxWidth: "72%",
  },
  bubbleRight: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginHorizontal: 6,
    maxWidth: "72%",
  },
  textLeft: { color: "#000", fontSize: 15 },
  textRight: { color: "#fff", fontSize: 15 },
  time: { fontSize: 11, color: "#888", alignSelf: "center", marginBottom: 4 },

  timeOnly: {
    fontSize: 11,
    color: "#888",
    alignSelf: "center",
    marginVertical: 6,
  },

  // system rows
  systemBox: {
    alignSelf: "center",
    backgroundColor: "#F6F6F6",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 8,
    maxWidth: "92%",
  },
  systemText: { color: "#333", fontSize: 14, textAlign: "center", lineHeight: 20 },

  // unified system cards for buyer/seller
  userCardBubble: {
    backgroundColor: "#FFF6D8",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    maxWidth: "72%",
    minWidth: "60%",
  },
  userCardBubbleBuyer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    maxWidth: "72%",
    minWidth: "60%",
  },
  userCardTitle: {
    fontWeight: "700",
    color: "#111",
    fontSize: 15,
    marginBottom: 6,
  },
  userCardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#ddd",
    marginHorizontal: -14,
    marginBottom: 6,
  },
  userCardSubtitle: {
    color: "#444",
    fontSize: 13,
    lineHeight: 18,
  },
  userCardBtn: {
    alignSelf: "flex-end",
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
    marginTop: 8,
  },
  userCardBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
  },

  // order card
  orderCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  orderThumb: { width: 64, height: 64, borderRadius: 8, marginRight: 12, backgroundColor: "#eee" },
  orderTitle: { fontWeight: "700", fontSize: 16, marginBottom: 6 },
  orderPrice: { color: "#e11d48", fontWeight: "800", marginBottom: 6 },
  orderMeta: { color: "#555", marginBottom: 2 },
  orderStatus: { color: "#666" },

  // review CTA
  reviewBox: {
    backgroundColor: "#F6F6F6",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  reviewHint: { color: "#555", fontSize: 14, marginBottom: 12, lineHeight: 20, textAlign: "left" },
  reviewBtnCenter: {
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },
  reviewBtnText: { fontSize: 14, color: "#111", fontWeight: "700" },

  // input bar
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
