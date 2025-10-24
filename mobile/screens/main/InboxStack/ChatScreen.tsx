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
  Alert,
} from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { InboxStackParamList } from "./InboxStackNavigator";
import Icon from "../../../components/Icon";
import Header from "../../../components/Header";
import ASSETS from "../../../constants/assetUrls";
import { messagesService, ordersService, type Message, type ConversationDetail } from "../../../src/services";
import { useAuth } from "../../../contexts/AuthContext";
import { API_CONFIG } from "../../../src/config/api";

type Order = {
  id: string;
  product: { title: string; price: number; size?: string; image: string | null };
  seller: { name: string; avatar?: string };
  buyer?: { name: string; avatar?: string };
  status: "Delivered" | "Shipped" | "Processing" | string;
  address?: { name?: string; phone?: string; detail?: string };
  payment?: { method?: string; amount?: number; date?: string; transactionId?: string };
};

type ChatItem =
  | { 
      id: string; 
      type: "msg"; 
      sender: "me" | "other"; 
      text: string; 
      time?: string;
      senderInfo?: {
        id: number;
        username: string;
        avatar: string | null;
      };
    }
  | {
      id: string;
      type: "system";
      text: string;
      time?: string;
      sentByUser?: boolean;
      avatar?: string;
      orderId?: string;
      senderInfo?: {
        id: number;
        username: string;
        avatar: string | null;
      };
    }
  | { 
      id: string; 
      type: "orderCard"; 
      order: Order;
    }
  | { 
      id: string; 
      type: "reviewCta"; 
      text: string; 
      orderId: string;
    };

// 🔥 状态转换函数 - 与OrderDetailScreen保持一致
const getDisplayStatus = (status: string): string => {
  switch (status) {
    case "IN_PROGRESS": return "In Progress";
    case "TO_SHIP": return "To Ship";
    case "SHIPPED": return "Shipped";
    case "DELIVERED": return "Delivered";
    case "RECEIVED": return "Received";
    case "COMPLETED": return "Completed";
    case "REVIEWED": return "Reviewed";
    case "CANCELLED": return "Cancelled";
    case "Inquiry": return "Inquiry";
    default: return status;
  }
    };

export default function ChatScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<InboxStackParamList, "Chat">>();
  const route = useRoute<any>();
  const { sender = "TOP Support", kind = "support", order = null, conversationId = null } = route.params || {};
  const { user } = useAuth();

  // 状态管理
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [lastOrderStatus, setLastOrderStatus] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatItem>>(null);

  // —— MOCK 数据：保留作为 UI 参考和学习 —— //
  const mockItemsInit: ChatItem[] = useMemo(() => {
    if (kind === "order" && order) {
      const o: Order = {
        ...order,
        seller: {
          name: order?.seller?.name ?? "seller111",
          avatar: order?.seller?.avatar ?? (order?.seller?.name === "sellerCozy" ? "https://i.pravatar.cc/100?img=22" : "https://i.pravatar.cc/100?img=12"),
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
          { id: "m2", type: "msg", sender: "other", text: "Yes! It's in good condition and ready to ship 😊" },
          { id: "t2", type: "system", text: "Sep 20, 2025 18:36" },
          { id: "m3", type: "msg", sender: "me", text: "Great! I'll place the order now." },
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
          { id: "m1", type: "msg", sender: "me", text: "Ok, I'll ship the hoodie in 3 days." },
          { id: "m2", type: "msg", sender: "other", text: "Thank you! Looking forward to receiving it." },
          { id: "t2", type: "system", text: "Sep 29, 2025 10:15" },
          { id: "sys1", type: "system", text: "Seller has shipped your parcel.", time: "Sep 29, 2025 10:15" },
          { id: "sys2", type: "system", text: "Parcel is in transit.", time: "Oct 1, 2025 14:20" },
          {
            id: "sys3",
            type: "system",
            text: "Parcel arrived. Waiting for buyer to confirm received.",
            time: "Oct 3, 2025 09:30",
          },
          {
            id: "cta1",
            type: "reviewCta",
            text: "How was your experience? Leave a review to help others discover great items.",
            orderId: o.id,
          },
        ];
      }
    }

    if (sender === "TOP Support") {
      return [
        { id: "t0", type: "system", text: "Sep 20, 2025 18:30" },
        { id: "m1", type: "msg", sender: "other", text: "Hey @ccc446981, Welcome to TOP! 👋" },
        { id: "m2", type: "msg", sender: "me", text: "Thanks! How do I start selling?" },
        { id: "m3", type: "msg", sender: "other", text: "Great question! Here's how to get started:\n\n1. Take clear photos of your items\n2. Write detailed descriptions\n3. Set fair prices\n4. Respond quickly to buyers\n\nNeed help with anything specific?" },
        { id: "m4", type: "msg", sender: "me", text: "Perfect! I'll start with some clothes I don't wear anymore." },
        { id: "m5", type: "msg", sender: "other", text: "That's a great start! Remember to check our community guidelines and always be honest about item condition. Happy selling! 🎉" },
      ];
    }

    return [];
  }, [kind, order, sender]);

  // 🔥 Focus事件监听 - 当用户从OrderDetailScreen返回时同步状态
  useFocusEffect(
    React.useCallback(() => {
      const syncOrderStatus = async () => {
        if (!conversationId || kind !== "order") return;
        
        try {
          console.log("🔄 Syncing order status on focus...");
          
          // 重新加载对话数据
          const conversationData = await messagesService.getMessages(conversationId);
          setConversation(conversationData);
          
          // 获取当前订单状态
          const orderCard = conversationData.messages.find(item => item.type === "orderCard");
          if (orderCard && orderCard.type === "orderCard" && orderCard.order) {
            const currentStatus = orderCard.order.status;
            console.log("🔍 Current order status:", currentStatus);
            console.log("🔍 Last order status:", lastOrderStatus);
            
            // 如果状态发生变化，添加系统消息并更新订单卡片
            if (lastOrderStatus && lastOrderStatus !== currentStatus) {
              console.log("🔄 Order status changed from", lastOrderStatus, "to", currentStatus);
              
              const systemMessage = generateSystemMessage(lastOrderStatus, currentStatus, orderCard.order);
              if (systemMessage) {
                // 🔥 更新订单卡片状态
                setItems(prev => prev.map(item => {
                  if (item.type === "orderCard" && item.order.id === orderCard.order!.id) {
                    return {
                      ...item,
                      order: {
                        ...item.order,
                        status: currentStatus
                      }
                    };
                  }
                  return item;
                }));
                
                // 🔥 添加系统消息
                setItems(prev => [...prev, systemMessage]);
                setTimeout(() => {
                  listRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }
            }
            
            setLastOrderStatus(currentStatus);
          }
        } catch (error) {
          console.error("❌ Error syncing order status:", error);
        }
      };
      
      syncOrderStatus();
    }, [conversationId, kind, lastOrderStatus])
  );

  // 生成系统消息的函数 - 与mock数据格式完全对齐
  const generateSystemMessage = (oldStatus: string, newStatus: string, order: Order): ChatItem | null => {
    const timestamp = new Date().toLocaleTimeString(); // 🔥 使用简单时间格式
    
    switch (newStatus) {
      case "IN_PROGRESS":
        // 🔥 添加支付确认消息，与mock数据一致
        return {
          id: `system-paid-${Date.now()}`,
          type: "system",
          text: `${user?.username || 'Buyer'} has paid for the order.\nPlease prepare the package and ship soon.`,
          time: timestamp,
          orderId: order.id,
          sentByUser: false,
          avatar: order.buyer?.avatar
        };
      
      case "TO_SHIP":
        // 🔥 添加准备发货消息
        return {
          id: `system-prepare-${Date.now()}`,
          type: "system",
          text: "Order confirmed. Please prepare the package and ship soon.",
          time: timestamp,
          orderId: order.id
        };
      
      case "SHIPPED":
        return {
          id: `system-shipped-${Date.now()}`,
          type: "system",
          text: "Seller has shipped your parcel.",
          time: timestamp,
          orderId: order.id
        };
      
      case "DELIVERED":
        return {
          id: `system-delivered-${Date.now()}`,
          type: "system",
          text: "Parcel arrived. Waiting for buyer to confirm received.",
          time: timestamp,
          orderId: order.id
        };
      
      case "RECEIVED":
        return {
          id: `system-received-${Date.now()}`,
          type: "system",
          text: "Order confirmed received. Transaction completed.",
          time: timestamp,
          orderId: order.id
        };
      
      case "CANCELLED":
        return {
          id: `system-cancelled-${Date.now()}`,
          type: "system",
          text: "Order has been cancelled.",
          time: timestamp,
          orderId: order.id
        };
      
      case "COMPLETED":
        return {
          id: `system-completed-${Date.now()}`,
          type: "system",
          text: "Order completed successfully.",
          time: timestamp,
          orderId: order.id
        };
      
      default:
        return null;
    }
  };

  const loadConversationData = async () => {
    if (!conversationId) {
      // 如果没有 conversationId，只显示欢迎消息（不显示完整的 mock 数据）
      console.log("🔍 No conversationId, showing welcome message only");
      if (sender === "TOP Support") {
        const welcomeMessage: ChatItem = {
          id: "welcome-1",
          type: "msg",
          sender: "other",
          text: `Hey @${user?.username || 'user'}, Welcome to TOP! 👋`,
          time: new Date().toLocaleString()
        };
        setItems([welcomeMessage]);
      } else {
        setItems([]); // 其他情况显示空对话
      }
      return;
    }

    // 如果是普通聊天（general），不显示商品卡片
    if (kind === "general") {
      console.log("🔍 General chat, loading messages without order card");
    }

    try {
      setIsLoading(true);
      console.log("🔍 Loading conversation:", conversationId);
      
      const conversationData = await messagesService.getMessages(conversationId);
      setConversation(conversationData);
      
      console.log("🔍 API 返回的对话数据:", conversationData);
      console.log("🔍 API 返回的消息数量:", conversationData.messages?.length || 0);
      
      // 转换 API 数据为 ChatItem 格式
      const apiItems: ChatItem[] = conversationData.messages.map((msg: Message) => {
        if (msg.type === "msg") {
          return {
            id: msg.id,
            type: "msg",
            sender: msg.sender || "other",
            text: msg.text,
            time: msg.time,
            senderInfo: msg.senderInfo
          };
        } else if (msg.type === "system") {
          return {
            id: msg.id,
            type: "system",
            text: msg.text,
            time: msg.time,
            senderInfo: msg.senderInfo
          };
        } else if (msg.type === "orderCard" && msg.order) {
          return {
            id: msg.id,
            type: "orderCard",
            order: msg.order
          };
        } else {
          // Fallback for unknown types - 确保所有消息都显示
          return {
            id: msg.id,
            type: "msg",
            sender: msg.sender || "other",
            text: msg.text,
            time: msg.time,
            senderInfo: msg.senderInfo
          };
        }
      });

      console.log("🔍 转换后的消息数量:", apiItems.length);
      console.log("🔍 转换后的消息:", apiItems);

      // 处理不同类型的聊天
      let finalItems = apiItems;
      
      if (kind === "general") {
        // 普通聊天：过滤掉商品卡片
        finalItems = apiItems.filter(item => item.type !== "orderCard");
        console.log("🔍 普通聊天，过滤后的消息数量:", finalItems.length);
      } else if (kind === "order") {
        // 订单聊天：在开头添加商品卡片
        console.log("🔍 订单聊天，添加商品卡片");
        
        // 优先使用 route.params.order，如果没有则使用 conversation.order
        const orderData = order || conversation?.order;
        console.log("🔍 Order 数据来源:", order ? "route.params" : "conversation");
        console.log("🔍 Order 数据:", JSON.stringify(orderData, null, 2));
        
        if (orderData) {
          const orderCard: ChatItem = {
            id: "order-card-" + orderData.id,
            type: "orderCard",
            order: {
              id: orderData.id,
              product: {
                title: orderData.product.title,
                price: orderData.product.price,
                size: orderData.product.size,
                image: orderData.product.image
              },
              seller: {
                name: orderData.seller.name,
                avatar: orderData.seller.avatar
              },
              buyer: orderData.buyer ? {
                name: orderData.buyer.name,
                avatar: orderData.buyer.avatar
              } : undefined,
              status: orderData.status || "Inquiry"
            }
          };
          
          console.log("🔍 创建的商品卡片:", JSON.stringify(orderCard, null, 2));
          
          // 检查是否已经有商品卡片，避免重复
          const hasOrderCard = apiItems.some(item => item.type === "orderCard");
          if (!hasOrderCard) {
            finalItems = [orderCard, ...apiItems];
            console.log("🔍 添加了商品卡片，总消息数量:", finalItems.length);
          } else {
            console.log("🔍 商品卡片已存在，不重复添加");
          }
        } else {
          console.log("⚠️ 订单聊天但没有找到商品数据");
        }
      }

      // 如果是 TOP Support 对话且没有消息，添加欢迎消息
      if (sender === "TOP Support" && finalItems.length === 0) {
        const welcomeMessage: ChatItem = {
          id: "welcome-1",
          type: "msg",
          sender: "other",
          text: `Hey @${user?.username || 'user'}, Welcome to TOP! 👋`,
          time: new Date().toLocaleString()
        };
        setItems([welcomeMessage]);
        console.log("🔍 Added welcome message for new user");
      } else {
        setItems(finalItems);
        console.log("🔍 Loaded", finalItems.length, "messages from API");
        
        // 🔥 记录当前订单状态
        const orderCard = finalItems.find(item => item.type === "orderCard");
        if (orderCard && orderCard.type === "orderCard") {
          setLastOrderStatus(orderCard.order.status);
          console.log("🔍 Recorded order status:", orderCard.order.status);
        }
      }
      
    } catch (error) {
      console.error("❌ Error loading conversation:", error);
      // Fallback 到欢迎消息（不显示完整 mock 数据）
      console.log("🔍 Falling back to welcome message only");
      if (sender === "TOP Support") {
        const welcomeMessage: ChatItem = {
          id: "welcome-1",
          type: "msg",
          sender: "other",
          text: `Hey @${user?.username || 'user'}, Welcome to TOP! 👋`,
          time: new Date().toLocaleString()
        };
        setItems([welcomeMessage]);
      } else {
        setItems([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversationData();
  }, [conversationId, sender, kind, order]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // 如果没有 conversationId，只更新本地状态（不发送到后端）
    if (!conversationId) {
      setItems((prev) => [
        ...prev,
        { id: String(Date.now()), type: "msg", sender: "me", text: input, time: "Now" },
      ]);
      setInput("");
      return;
    }

    try {
      // 发送到后端 API
      const newMessage = await messagesService.sendMessage(conversationId, {
        content: input.trim(),
        message_type: "TEXT"
      });

      // 添加到本地状态
      const chatItem: ChatItem = {
        id: newMessage.id,
        type: "msg",
        sender: newMessage.sender || "me",
        text: newMessage.text,
        time: newMessage.time,
        senderInfo: newMessage.senderInfo
      };

      setItems((prev) => [...prev, chatItem]);
      setInput("");
      
      console.log("🔍 Message sent successfully");
    } catch (error) {
      console.error("❌ Error sending message:", error);
      // 即使发送失败，也添加到本地状态
      setItems((prev) => [
        ...prev,
        { id: String(Date.now()), type: "msg", sender: "me", text: input, time: "Now" },
      ]);
      setInput("");
    }
  };

  // —— UI 组件 —— //
  const renderOrderCard = (o: Order) => {
    // 🔥 修复：正确判断当前用户是否为卖家
    // 在订单对话中，initiator 是买家，participant 是卖家
    // 如果当前用户ID等于participant_id，则当前用户是卖家
    const isSeller = (conversation?.conversation as any)?.participant_id === user?.id;
    
    console.log("🔍 Order card - isSeller:", isSeller);
    console.log("🔍 Order card - conversation participant_id:", (conversation?.conversation as any)?.participant_id);
    console.log("🔍 Order card - current user id:", user?.id);
    console.log("🔍 Order card - current user username:", user?.username);
    console.log("🔍 Order card - order seller:", o.seller.name);
    console.log("🔍 Order card - order buyer:", o.buyer?.name);

    const handleBuyNow = () => {
      console.log("🛒 Buy Now clicked for listing:", o.id);
      
      // 🔥 跳转到CheckoutScreen而不是直接创建订单
      const rootNavigation = (navigation as any).getParent?.();
      if (rootNavigation) {
        // 构造单个商品的购物车项目格式
        const singleItem = {
          item: {
            id: o.id,
            name: o.product.title,
            price: o.product.price,
            image: o.product.image,
            size: o.product.size,
            seller: o.seller
          },
          quantity: 1
        };
        
        console.log("🔍 Navigating to Checkout with item:", singleItem);
        
        // 🔥 BuyStack在根级别，直接导航
        rootNavigation.navigate("Buy", {
          screen: "Checkout",
          params: {
            items: [singleItem],
            subtotal: o.product.price,
            shipping: 5.99 // 默认运费
          }
        });
      } else {
        console.error("❌ Root navigation not found");
      }
    };

    // 🔥 买家操作函数
    const handleCancelOrder = async () => {
      console.log("🚫 Cancel Order button pressed for order:", o.id);
      try {
        Alert.alert(
          "Cancel Order",
          "Are you sure you want to cancel this order?",
          [
            { text: "No", style: "cancel" },
            {
              text: "Yes",
              onPress: async () => {
                try {
                  await ordersService.updateOrderStatus(parseInt(o.id), { status: "CANCELLED" });
                  
                  // 更新聊天中的订单状态
                  const updatedItems = items.map(item => {
                    if (item.type === "orderCard" && item.order.id === o.id) {
                      return {
                        ...item,
                        order: { ...item.order, status: "CANCELLED" }
                      };
                    }
                    return item;
                  });
                  setItems(updatedItems);
                  
                  // 发送系统消息
                  const systemMessage: ChatItem = {
                    id: `system-cancel-${Date.now()}`,
                    type: "system",
                    text: `Order #${o.id} has been cancelled.`,
                    time: new Date().toLocaleTimeString(),
                    orderId: o.id
                  };
                  setItems(prev => [...prev, systemMessage]);
                  
                  Alert.alert("Success", "Order has been cancelled.");
                } catch (error) {
                  console.error("Error cancelling order:", error);
                  Alert.alert("Error", "Failed to cancel order. Please try again.");
                }
              }
            }
          ]
        );
      } catch (error) {
        console.error("Error in cancel order:", error);
      }
    };

    const handleOrderReceived = async () => {
      console.log("📦 Order Received button pressed for order:", o.id);
      try {
        await ordersService.updateOrderStatus(parseInt(o.id), { status: "RECEIVED" });
        
        // 更新聊天中的订单状态
        const updatedItems = items.map(item => {
          if (item.type === "orderCard" && item.order.id === o.id) {
            return {
              ...item,
              order: { ...item.order, status: "RECEIVED" }
            };
          }
          return item;
        });
        setItems(updatedItems);
        
        // 发送系统消息
        const systemMessage: ChatItem = {
          id: `system-received-${Date.now()}`,
          type: "system",
          text: `Order #${o.id} has been marked as received.`,
          time: new Date().toLocaleTimeString(),
          orderId: o.id
        };
        setItems(prev => [...prev, systemMessage]);
        
        Alert.alert("Success", "Order has been marked as received.");
      } catch (error) {
        console.error("Error marking order as received:", error);
        Alert.alert("Error", "Failed to update order status. Please try again.");
      }
    };

    const handleLeaveReview = () => {
      console.log("⭐ Leave Review button pressed for order:", o.id);
      const rootNavigation = (navigation as any).getParent?.();
      if (rootNavigation) {
        rootNavigation.navigate("Main", {
          screen: "MyTop",
          params: {
            screen: "Review",
            params: { orderId: o.id }
          }
        });
      }
    };

    // 🔥 卖家操作函数
    const handleMarkShipped = async () => {
      console.log("📦 Mark as Shipped button pressed for order:", o.id);
      try {
        await ordersService.updateOrderStatus(parseInt(o.id), { status: "SHIPPED" });
        
        // 更新聊天中的订单状态
        const updatedItems = items.map(item => {
          if (item.type === "orderCard" && item.order.id === o.id) {
            return {
              ...item,
              order: { ...item.order, status: "SHIPPED" }
            };
          }
          return item;
        });
        setItems(updatedItems);
        
        // 发送系统消息
        const systemMessage: ChatItem = {
          id: `system-shipped-${Date.now()}`,
          type: "system",
          text: `Order #${o.id} has been marked as shipped.`,
          time: new Date().toLocaleTimeString(),
          orderId: o.id
        };
        setItems(prev => [...prev, systemMessage]);
        
        Alert.alert("Success", "Order has been marked as shipped.");
      } catch (error) {
        console.error("Error marking order as shipped:", error);
        Alert.alert("Error", "Failed to update order status. Please try again.");
      }
    };

    const handleCancelSold = async () => {
      console.log("🚫 Cancel Sold Order button pressed for order:", o.id);
      try {
        Alert.alert(
          "Cancel Order",
          "Are you sure you want to cancel this order?",
          [
            { text: "No", style: "cancel" },
            {
              text: "Yes",
              onPress: async () => {
                try {
                  await ordersService.updateOrderStatus(parseInt(o.id), { status: "CANCELLED" });
                  
                  // 更新聊天中的订单状态
                  const updatedItems = items.map(item => {
                    if (item.type === "orderCard" && item.order.id === o.id) {
                      return {
                        ...item,
                        order: { ...item.order, status: "CANCELLED" }
                      };
                    }
                    return item;
                  });
                  setItems(updatedItems);
                  
                  // 发送系统消息
                  const systemMessage: ChatItem = {
                    id: `system-cancel-sold-${Date.now()}`,
                    type: "system",
                    text: `Order #${o.id} has been cancelled by seller.`,
                    time: new Date().toLocaleTimeString(),
                    orderId: o.id
                  };
                  setItems(prev => [...prev, systemMessage]);
                  
                  Alert.alert("Success", "Order has been cancelled.");
                } catch (error) {
                  console.error("Error cancelling sold order:", error);
                  Alert.alert("Error", "Failed to cancel order. Please try again.");
                }
              }
            }
          ]
        );
      } catch (error) {
        console.error("Error in cancel sold order:", error);
      }
    };

    const handleViewMutualReview = () => {
      console.log("👀 View Mutual Review button pressed for order:", o.id);
      const rootNavigation = (navigation as any).getParent?.();
      if (rootNavigation) {
        rootNavigation.navigate("Main", {
          screen: "MyTop",
          params: {
            screen: "MutualReview",
            params: { orderId: o.id }
          }
        });
      }
    };

    const handleCardPress = async () => {
      console.log("🔍 Order card pressed, navigating to ListingDetail");
      console.log("🔍 Order ID:", o.id);
      console.log("🔍 Product image:", o.product.image);
      console.log("🔍 Current user is seller:", isSeller);
      
      try {
        // 🔥 获取完整的listing数据
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/listings/${o.id}`);
        const listingData = await response.json();
        console.log("🔍 Fetched listing data:", listingData);
        
        // 🔥 转换数据格式以匹配ListingItem
        const listingItem = {
          id: listingData.listing?.id?.toString() || o.id,
          title: listingData.listing?.title || o.product.title,
          price: Number(listingData.listing?.price) || o.product.price,
          description: listingData.listing?.description || `Size: ${o.product.size || 'One Size'}`,
          brand: listingData.listing?.brand || "Brand",
          size: listingData.listing?.size || o.product.size || "One Size",
          condition: listingData.listing?.condition || "Good",
          material: listingData.listing?.material || "Mixed",
          gender: listingData.listing?.gender || "unisex",
          tags: listingData.listing?.tags || [],
          images: Array.isArray(listingData.listing?.images) ? listingData.listing.images : 
                 listingData.listing?.image_url ? [listingData.listing.image_url] : 
                 o.product.image ? [o.product.image] : [],
          category: listingData.listing?.category?.toLowerCase() || "top",
          seller: {
            id: listingData.listing?.seller?.id || 0,
            name: listingData.listing?.seller?.name || o.seller.name,
            avatar: listingData.listing?.seller?.avatar || o.seller.avatar || "",
            rating: listingData.listing?.seller?.rating || 5.0,
            sales: listingData.listing?.seller?.sales || 0
          }
        };
        
        console.log("🔍 Converted listingItem:", listingItem);
        
        // 🔥 根据是否是自己的listing决定跳转逻辑
        const rootNavigation = (navigation as any).getParent?.();
        if (rootNavigation) {
          // 🔥 判断是否是自己的listing：比较当前用户ID和listing的seller ID
          const isOwnListing = user?.id && listingData.listing?.seller?.id && 
                               Number(user.id) === Number(listingData.listing.seller.id);
          
          console.log("🔍 Is own listing:", isOwnListing);
          console.log("🔍 Current user ID:", user?.id);
          console.log("🔍 Listing seller ID:", listingData.listing?.seller?.id);
          
          if (isOwnListing) {
            // 🔥 自己的listing：跳转到ListingDetail页面但显示卖家视角（没有购买按钮）
            console.log("🔍 Navigating to own listing detail");
        rootNavigation.navigate("Buy", {
              screen: "ListingDetail",
          params: {
                item: listingItem,
                isOwnListing: true // 🔥 传递标记表示这是自己的listing
              }
            });
          } else {
            // 🔥 别人的listing：跳转到购买页面
            console.log("🔍 Navigating to purchase listing");
            rootNavigation.navigate("Buy", {
              screen: "ListingDetail",
              params: {
                item: listingItem
              }
            });
          }
        }
      } catch (error) {
        console.error("❌ Error fetching listing:", error);
        Alert.alert("Error", "Failed to load listing details");
      }
    };

    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={handleCardPress}
        activeOpacity={0.8}
      >
        <Image 
          source={{ uri: o.product.image || "https://via.placeholder.com/64x64/f0f0f0/999999?text=No+Image" }} 
          style={styles.orderThumb} 
        />
        <View style={styles.orderContent}>
          <Text style={styles.orderTitle} numberOfLines={2}>
            {o.product.title}
          </Text>
          <Text style={styles.orderPrice}>
            ${o.product.price}
            {o.product.size ? ` · Size ${o.product.size}` : ""}
          </Text>
          <Text style={styles.orderMeta}>
            {isSeller
              ? `Inquiry from ${o?.buyer?.name ?? "Buyer"}`
              : `Sold by ${o?.seller?.name ?? "Seller"}`}
          </Text>
          <Text style={styles.orderStatus}>Status: {getDisplayStatus(o.status)}</Text>
        </View>
        <View style={styles.orderActions}>
          {/* 🔥 买家按钮逻辑 - 与OrderDetailScreen一致 */}
          {!isSeller && (
            <>
              {/* Inquiry状态 - Buy Now按钮 */}
              {o.status === "Inquiry" && (
            <TouchableOpacity 
              style={styles.buyButton}
              onPress={handleBuyNow}
              activeOpacity={0.8}
            >
              <Text style={styles.buyButtonText}>Buy Now</Text>
            </TouchableOpacity>
              )}
              
              {/* IN_PROGRESS状态 - Cancel Order按钮 */}
              {o.status === "IN_PROGRESS" && (
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: "#F54B3D" }]}
                  onPress={handleCancelOrder}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>Cancel Order</Text>
                </TouchableOpacity>
              )}
              
              {/* DELIVERED状态 - Order Received按钮 */}
              {o.status === "DELIVERED" && (
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: "#000" }]}
                  onPress={handleOrderReceived}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>Order Received</Text>
                </TouchableOpacity>
              )}
              
              {/* RECEIVED/COMPLETED状态 - Leave Review按钮 */}
              {["RECEIVED", "COMPLETED"].includes(o.status) && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleLeaveReview}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>Leave Review</Text>
                </TouchableOpacity>
              )}
              
              {/* CANCELLED状态 - Buy Now按钮 */}
              {o.status === "CANCELLED" && (
                <TouchableOpacity
                  style={styles.buyButton}
                  onPress={handleBuyNow}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buyButtonText}>Buy Now</Text>
                </TouchableOpacity>
              )}

              {/* 其他状态 - 显示状态徽章 */}
              {!["Inquiry", "IN_PROGRESS", "DELIVERED", "RECEIVED", "COMPLETED", "CANCELLED"].includes(o.status) && (
            <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{getDisplayStatus(o.status)}</Text>
            </View>
          )}
            </>
          )}
          
          {/* 🔥 卖家按钮逻辑 - 与OrderDetailScreen一致 */}
          {isSeller && (
            <>
              {/* TO_SHIP状态 - Mark as Shipped + Cancel Order按钮 */}
              {o.status === "TO_SHIP" && (
                <View style={styles.sellerActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: "#000" }]}
                    onPress={handleMarkShipped}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionButtonText}>Mark as Shipped</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: "#F54B3D", marginTop: 8 }]}
                    onPress={handleCancelSold}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionButtonText}>Cancel Order</Text>
                  </TouchableOpacity>
        </View>
              )}
              
              {/* COMPLETED状态 - Leave Review按钮 */}
              {o.status === "COMPLETED" && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleLeaveReview}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>Leave Review</Text>
                </TouchableOpacity>
              )}
              
              {/* REVIEWED状态 - View Mutual Review按钮 */}
              {o.status === "REVIEWED" && (
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: "#2d7ef0" }]}
                  onPress={handleViewMutualReview}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>View Mutual Review</Text>
                </TouchableOpacity>
              )}
              
              {/* 其他状态 - 显示状态徽章 */}
              {!["TO_SHIP", "COMPLETED", "REVIEWED"].includes(o.status) && (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{getDisplayStatus(o.status)}</Text>
      </View>
              )}
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  type SystemItem = Extract<ChatItem, { type: "system" }>;

  const renderSystem = (item: SystemItem) => {
    const { id, text, time, sentByUser, avatar, senderInfo } = item;
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
          <View style={styles.messageRow}>
            {/* TOP Support 头像 */}
            {senderInfo?.username === "TOP Support" && (
              <Image
                source={ASSETS.avatars.top}
                style={[styles.avatar, { marginRight: 6 }]}
              />
            )}
            <View style={bubbleStyle}>
              <Text style={styles.userCardTitle}>{title}</Text>
              <View style={styles.userCardDivider} />
              <Text style={styles.userCardSubtitle}>{subtitle}</Text>
              <TouchableOpacity style={styles.userCardBtn}>
                <Text style={styles.userCardBtnText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      );
    }

    // 其他系统提示（物流状态等）维持灰框样式，但添加头像
    return (
      <>
        {time ? <Text style={styles.time}>{time}</Text> : null}
        <View style={styles.messageRow}>
          {/* TOP Support 头像 */}
          {senderInfo?.username === "TOP Support" && (
            <Image
              source={ASSETS.avatars.top}
              style={[styles.avatar, { marginRight: 6 }]}
            />
          )}
          <View style={styles.systemBox}>
            <Text style={styles.systemText}>{text}</Text>
          </View>
        </View>
      </>
    );
  };

  const renderReviewCTA = (orderId: string, text: string) => (
    <View style={styles.reviewBox}>
      <Text style={styles.reviewHint}>{text}</Text>
      <TouchableOpacity style={styles.reviewBtnCenter}>
        <Text style={styles.reviewBtnText}>Leave Review</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title={sender} showBack />

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
                {/* 🔥 对方头像：优先使用 senderInfo.avatar，否则使用默认头像 */}
                {item.sender !== "me" && (
                  <Image
                    source={
                      sender === "TOP Support"
                        ? ASSETS.avatars.top
                        : item.senderInfo?.avatar 
                        ? { uri: item.senderInfo.avatar }
                        : ASSETS.avatars.default
                    }
                    style={[styles.avatar, { marginRight: 6 }]}
                  />
                )}
                <View
                  style={[
                    item.sender === "me" ? styles.bubbleRight : styles.bubbleLeft,
                    item.sender === "me" && { marginLeft: "auto" },
                  ]}
                >
                  <Text style={item.sender === "me" ? styles.textRight : styles.textLeft}>
                    {item.text}
                  </Text>
                </View>
                {/* 我的头像 */}
                {item.sender === "me" && (
                  <Image
                    source={item.senderInfo?.avatar ? { uri: item.senderInfo.avatar } : ASSETS.avatars.default}
                    style={[styles.avatar, { marginLeft: 6 }]}
                  />
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
    alignItems: "center",
  },
  orderThumb: { 
    width: 64, 
    height: 64, 
    borderRadius: 8, 
    marginRight: 12, 
    backgroundColor: "#eee" 
  },
  orderContent: {
    flex: 1,
    marginRight: 12,
  },
  orderTitle: { 
    fontWeight: "700", 
    fontSize: 16, 
    marginBottom: 6,
    color: "#111"
  },
  orderPrice: { 
    color: "#e11d48", 
    fontWeight: "800", 
    marginBottom: 6,
    fontSize: 16
  },
  orderMeta: { 
    color: "#555", 
    marginBottom: 2,
    fontSize: 13
  },
  orderStatus: { 
    color: "#666",
    fontSize: 13
  },
  orderActions: {
    alignItems: "center",
    justifyContent: "center",
  },
  buyButton: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
    borderWidth: 1,
    borderColor: "#000",
  },
  buyButtonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 13,
  },
  actionButton: {
    backgroundColor: "#000",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  sellerActions: {
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadgeText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 12,
    textAlign: "center",
  },

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