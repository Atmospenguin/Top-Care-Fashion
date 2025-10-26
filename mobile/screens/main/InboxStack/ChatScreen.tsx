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
  product: {
    title: string;
    price: number;
    size?: string;
    image: string | null;
    shippingFee?: number; // 🔥 添加运费字段
  };
  seller: { 
    name: string;
    avatar?: string;
  };
  buyer?: {
    name: string;
    avatar?: string;
  };
  status: string;
  // 🔥 添加listing_id字段用于BuyNow功能
  listing_id?: number;
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
      reviewType?: "buyer" | "seller";
    }
  | { 
      id: string; 
      type: "reviewReplyCta"; 
      text: string; 
      orderId: string;
      reviewType?: "buyer" | "seller";
    }
  | { 
      id: string; 
      type: "mutualReviewCta"; 
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
  const { sender = "TOP Support", kind = "support", order = null, conversationId = null, autoSendPaidMessage = false } = route.params || {};
  const { user } = useAuth();

  // 状态管理
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [lastOrderStatus, setLastOrderStatus] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatItem>>(null);

  // 🔥 移除重复的 useEffect，只保留 focus listener 中的逻辑

  // 🔥 监听路由参数变化，处理从CheckoutScreen返回的订单信息
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log("🔍 ChatScreen focused, checking for new order data");
      console.log("🔍 Route params:", route.params);
      console.log("🔍 ConversationId:", conversationId);
      console.log("🔍 Order:", order);
      console.log("🔍 AutoSendPaidMessage:", autoSendPaidMessage);
      
      // 🔥 重新加载对话数据，获取最新的订单信息
      const reloadData = async () => {
        if (conversationId) {
          await loadConversationData();
        } else {
          // 🔥 如果没有conversationId，也重新加载数据（可能显示订单卡片）
          await loadConversationData();
        }
        
        // 🔥 数据加载完成后，检查是否需要发送 "I've paid" 消息
        setTimeout(() => {
          // 🔥 检查是否需要发送 "I've paid" 消息
          // 条件：1. 有订单 2. 订单状态是 IN_PROGRESS 3. 还没有发送过消息
          if (order && order.status === "IN_PROGRESS") {
            console.log("🔍 Order found with IN_PROGRESS status, checking for paid message");
            
            // 🔥 检查本地消息中是否已经有 "I've paid" 消息
            const hasPaidMessage = items.some(item => 
              item.type === "system" && 
              item.sentByUser === true && 
              item.text.includes("I've paid, waiting for you to ship")
            );
            
            console.log("🔍 Has paid message:", hasPaidMessage);
            
            if (!hasPaidMessage) {
              console.log("🔍 Sending 'I've paid' message");
              
              const paidMessage: ChatItem = {
                id: `auto-paid-${Date.now()}`,
                type: "system",
                text: "I've paid, waiting for you to ship\nPlease pack the item and ship to the address I provided on TOP.",
                sentByUser: true,
                senderInfo: {
                  id: user?.id || 0,
                  username: user?.username || "Buyer",
                  avatar: user?.avatar_url || ""
                }, // 🔥 重新添加 senderInfo 字段
                time: new Date().toLocaleTimeString()
              };
              
              setItems(prev => [...prev, paidMessage]);
              
              // 🔥 异步发送消息到后端
              const sendMessageToBackend = async () => {
                if (conversationId) {
                  try {
                    await messagesService.sendMessage(conversationId, {
                      content: paidMessage.text,
                      message_type: "SYSTEM"
                    });
                    console.log("✅ 'I've paid' message sent to backend via focus listener");
                  } catch (error) {
                    console.error("❌ Failed to send 'I've paid' message to backend:", error);
                  }
                } else {
                  console.log("⚠️ No conversationId, trying to create conversation and send message");
                  
                  // 🔥 尝试创建对话并发送消息
                  try {
                    // 如果有订单信息，尝试创建对话
                    if (order && order.seller) {
                      console.log("🔍 Creating conversation for order:", order.id);
                      console.log("🔍 Seller:", order.seller);
                      console.log("🔍 Buyer:", user);
                      
                      // 🔥 创建对话
                      const sellerId = order.seller.id || order.seller.user_id;
                      const listingId = order.listing_id || order.product?.listing_id;
                      
                      console.log("🔍 Seller ID:", sellerId);
                      console.log("🔍 Listing ID:", listingId);
                      
                      if (!sellerId) {
                        console.error("❌ No seller ID found in order:", order);
                        return;
                      }
                      
                      const newConversation = await messagesService.createConversation({
                        participant_id: sellerId,
                        listing_id: listingId,
                        type: 'ORDER'
                      });
                      
                      console.log("✅ New conversation created:", newConversation);
                      
                      // 🔥 发送消息到新创建的对话
                      if (newConversation && newConversation.id) {
                        console.log("🔍 Attempting to send message to conversation:", newConversation.id);
                        console.log("🔍 Message content:", paidMessage.text);
                        console.log("🔍 Message type: SYSTEM");
                        
                        try {
                          const sentMessage = await messagesService.sendMessage(newConversation.id.toString(), {
                            content: paidMessage.text,
                            message_type: "SYSTEM"
                          });
                          console.log("✅ 'I've paid' message sent successfully:", sentMessage);
                          
                          // 🔥 更新 conversationId 状态
                          console.log("🔍 Conversation ID updated to:", newConversation.id);
                        } catch (sendError) {
                          console.error("❌ Failed to send message to conversation:", sendError);
                          console.error("❌ Send error details:", {
                            conversationId: newConversation.id,
                            messageContent: paidMessage.text,
                            messageType: "SYSTEM"
                          });
                        }
                      } else {
                        console.error("❌ No conversation ID available for sending message");
                        console.error("❌ New conversation data:", newConversation);
                      }
                    }
                  } catch (error) {
                    console.error("❌ Failed to create conversation:", error);
                  }
                }
              };
              
              sendMessageToBackend();
              
              setTimeout(() => {
                listRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }
          }
          
          // 🔥 检查是否需要发送其他状态变化的系统消息
          if (order && conversationId) {
            console.log("🔍 Checking for other order status changes, current status:", order.status);
            console.log("🔍 Order object:", order);
            console.log("🔍 Conversation object:", conversation);
            console.log("🔍 User object:", user);
            
            // 🔥 检查本地消息中是否已经有对应状态的系统消息
            const hasStatusMessage = items.some(item => 
              item.type === "system" && 
              item.text.includes("confirmed received") && 
              item.text.includes("Transaction completed")
            );
            
            console.log("🔍 Has status message for COMPLETED:", hasStatusMessage);
            console.log("🔍 Current items:", items.map(item => ({ 
              type: item.type, 
              text: item.type === "system" || item.type === "msg" ? item.text : "N/A" 
            })));
            
            // 🔥 如果订单状态是 COMPLETED 且没有对应的系统消息，生成并发送
            if (order.status === "COMPLETED" && !hasStatusMessage) {
              console.log("🔍 Order is COMPLETED, generating system message");
              
              // 🔥 判断当前用户是否为卖家
              const isSeller = (conversation?.conversation as any)?.participant_id === user?.id;
              console.log("🔍 isSeller:", isSeller);
              console.log("🔍 conversation.participant_id:", (conversation?.conversation as any)?.participant_id);
              console.log("🔍 user.id:", user?.id);
              
              // 🔥 使用 generateOrderSystemMessages 生成完整的系统消息（包括 review CTA）
              const systemMessages = generateOrderSystemMessages(order, isSeller, true); // skipPaidMessage = true
              console.log("🔍 Generated system messages:", systemMessages);
              
              // 🔥 添加系统消息到聊天列表
              setItems(prev => [...prev, ...systemMessages]);
              
              // 🔥 异步发送消息到后端
              const sendStatusMessageToBackend = async () => {
                try {
                  // 只发送主要的系统消息，不发送 review CTA（因为 CTA 是本地生成的）
                  const mainMessage = systemMessages.find(msg => msg.type === "system");
                  if (mainMessage) {
                    await messagesService.sendMessage(conversationId, {
                      content: mainMessage.text,
                      message_type: "SYSTEM"
                    });
                    console.log("✅ Status message sent to backend:", mainMessage.text);
                  }
                } catch (error) {
                  console.error("❌ Failed to send status message to backend:", error);
                }
              };
              
              sendStatusMessageToBackend();
            }
          }
        }, 1000); // 🔥 延迟1秒确保数据加载完成
      };
      
      reloadData();
    });

    return unsubscribe;
  }, [navigation, route.params, conversationId, order, items]);

  // 🔥 获取评论状态（通过 API 检查）
  const [reviewStatuses, setReviewStatuses] = useState<Record<string, {
    userRole: 'buyer' | 'seller';
    hasUserReviewed: boolean;
    hasOtherReviewed: boolean;
    userReview: any | null;
    otherReview: any | null;
  }>>({});

  // 🔥 检查订单的评论状态
  const checkOrderReviewStatus = async (orderId: string) => {
    try {
      const status = await ordersService.checkReviewStatus(parseInt(orderId));
      setReviewStatuses(prev => ({
        ...prev,
        [orderId]: {
          userRole: status.userRole,
          hasUserReviewed: status.hasUserReviewed,
          hasOtherReviewed: status.hasOtherReviewed,
          userReview: status.userReview,
          otherReview: status.otherReview,
        }
      }));
      console.log("⭐ Review status updated for order", orderId, ":", status);
    } catch (error) {
      console.error("❌ Error checking review status:", error);
    }
  };

  // 🔥 获取评论状态类型
  const getReviewStatusType = (orderId: string, currentUserId: number, orderData: any): string => {
    const status = reviewStatuses[orderId];
    
    if (!status) {
      // 如果没有检查过状态，返回默认值
      return "unknown";
    }

    if (status.hasUserReviewed && status.hasOtherReviewed) {
      return "mutualComplete";
    } else if (status.hasUserReviewed && !status.hasOtherReviewed) {
      return "waitingForOther";
    } else if (!status.hasUserReviewed && status.hasOtherReviewed) {
      return "canReply";
    } else {
      return "canReview";
    }
  };

  // 🔥 根据订单状态生成系统消息（根据用户角色显示不同内容）
  const generateOrderSystemMessages = (orderData: any, isSeller: boolean, skipPaidMessage: boolean = false): ChatItem[] => {
    const messages: ChatItem[] = [];
    const orderStatus = orderData.status;
    const orderId = orderData.id;
    
    // 根据订单状态和用户角色生成相应的系统消息
    switch (orderStatus) {
      case "IN_PROGRESS":
        if (!skipPaidMessage) { // 🔥 只有在不跳过时才生成
          if (isSeller) {
            // 🔥 卖家视角：显示买家已付款的消息（灰色卡片）
            messages.push({
              id: `seller-paid-${orderId}`,
              type: "system",
              text: `${orderData.buyer?.name || 'Buyer'} has paid for the order.\nPlease prepare the package and ship soon.`,
              sentByUser: false, // 灰色卡片
              avatar: orderData.buyer?.avatar,
              time: new Date().toLocaleTimeString()
            });
          } else {
            // 🔥 买家视角：显示自己已付款的消息（黄色卡片）
            messages.push({
              id: `buyer-paid-${orderId}`,
              type: "system",
              text: "I've paid, waiting for you to ship\nPlease pack the item and ship to the address I provided on TOP.",
              sentByUser: true, // 黄色卡片
              senderInfo: {
                id: orderData.buyer?.id || 0,
                username: orderData.buyer?.name || "Buyer",
                avatar: orderData.buyer?.avatar || ""
              }, // 🔥 添加 senderInfo 字段
              time: new Date().toLocaleTimeString()
            });
          }
        }
        break;
        
      case "TO_SHIP":
        if (isSeller) {
          messages.push({
            id: `sys-toship-seller-${orderId}`,
            type: "system",
            text: "Order confirmed. Please prepare the package and ship soon.",
            time: new Date().toLocaleTimeString()
          });
        } else {
          messages.push({
            id: `sys-toship-buyer-${orderId}`,
            type: "system",
            text: "Order confirmed. Seller is preparing to ship.",
            time: new Date().toLocaleTimeString()
          });
        }
        break;
        
      case "SHIPPED":
        if (isSeller) {
          messages.push({
            id: `sys-shipped-seller-${orderId}`,
            type: "system",
            text: "You have shipped the parcel.",
            time: new Date().toLocaleTimeString()
          });
        } else {
          messages.push({
            id: `sys-shipped-buyer-${orderId}`,
            type: "system",
            text: "Seller has shipped your parcel.",
            time: new Date().toLocaleTimeString()
          });
        }
        break;
        
      case "DELIVERED":
        if (isSeller) {
          messages.push({
            id: `sys-delivered-seller-${orderId}`,
            type: "system",
            text: "Parcel delivered. Waiting for buyer to confirm received.",
            time: new Date().toLocaleTimeString()
          });
        } else {
          messages.push({
            id: `sys-delivered-buyer-${orderId}`,
            type: "system",
            text: "Parcel arrived. Waiting for buyer to confirm received.",
            time: new Date().toLocaleTimeString()
          });
        }
        break;
        
      case "RECEIVED":
        if (isSeller) {
          messages.push({
            id: `sys-received-seller-${orderId}`,
            type: "system",
            text: "Buyer confirmed received. Transaction completed.",
            time: new Date().toLocaleTimeString()
          });
          
          // 🔥 添加评论 CTA（评论状态会在加载时异步检查）
          messages.push({
            id: `cta-review-seller-${orderId}`,
            type: "reviewCta",
            text: "How was your experience with the buyer? Leave a review to help others.",
            orderId: orderId,
            reviewType: "seller"
          });
        } else {
          messages.push({
            id: `sys-received-buyer-${orderId}`,
            type: "system",
            text: "I've confirmed received. Transaction completed.",
            time: new Date().toLocaleTimeString()
          });
          
          // 🔥 添加评论 CTA（评论状态会在加载时异步检查）
          messages.push({
            id: `cta-review-buyer-${orderId}`,
            type: "reviewCta",
            text: "How was your experience? Leave a review to help others discover great items.",
            orderId: orderId,
            reviewType: "buyer"
          });
        }
        break;
        
      case "COMPLETED":
        // 🔥 COMPLETED状态不需要额外的系统消息，Review CTA已经在RECEIVED状态处理了
        break;
        
      case "CANCELLED":
        // 🔥 需要根据订单的buyer_id和seller_id来判断谁取消了订单
        // 暂时使用通用的"I've cancelled this order."格式，通过renderSystem动态转换
        const cancelledMessage: ChatItem = {
          id: `sys-cancelled-${orderId}`,
          type: "system",
          text: "I've cancelled this order.",
          time: new Date().toLocaleTimeString(),
          // 注意：senderInfo需要从order对象中获取实际取消者的信息
          // 这里暂时不设置，让renderSystem通过order对象来判断
        };
        messages.push(cancelledMessage);
        break;
        
      case "REVIEWED":
        if (isSeller) {
          messages.push({
            id: `sys-reviewed-seller-${orderId}`,
            type: "system",
            text: "Buyer has submitted a review.",
            time: new Date().toLocaleTimeString()
          });
        } else {
          messages.push({
            id: `sys-reviewed-buyer-${orderId}`,
            type: "system",
            text: "Review submitted. Thank you for your feedback!",
            time: new Date().toLocaleTimeString()
          });
        }
        break;
    }
    
    return messages;
  };

  // 🔥 创建订单后自动发送用户消息
  const sendOrderCreatedMessage = async (orderData: any) => {
    try {
      console.log("🔍 发送订单创建消息:", orderData);
      
      // 🔥 判断当前用户是否为买家
      const isBuyer = (conversation?.conversation as any)?.initiator_id === user?.id;
      
      let userMessage: ChatItem;
      
      // 🔥 买家自动发送的卡片消息（卖家和买家都能看到）
      userMessage = {
        id: `buyer-paid-${orderData.id}-${Date.now()}`,
        type: "system",
        text: "I've paid, waiting for you to ship\nPlease pack the item and ship to the address I provided on TOP.",
        sentByUser: true, // 🔥 都是买家发送的，只是自动生成
        time: new Date().toLocaleTimeString()
      };
      
      // 添加到消息列表
      setItems(prev => [...prev, userMessage]);
      
      // 🔥 发送到服务器（如果需要）
      if (conversation?.conversation?.id) {
        await messagesService.sendMessage(conversation.conversation.id.toString(), {
          content: userMessage.text,
          message_type: "TEXT"
        });
        console.log("✅ 订单创建消息已发送到服务器");
      }
      
      // 滚动到底部
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (error) {
      console.error("❌ 发送订单创建消息失败:", error);
    }
  };

  // —— MOCK 数据：保留作为 UI 参考和学习 —— //
  const mockItemsInit: ChatItem[] = useMemo(() => {
    if (kind === "order" && order) {
      const o: Order = {
        id: order?.id ?? "1",
        product: {
          title: order?.product?.title ?? "Adidas jumper",
          price: order?.product?.price ?? 50,
          size: order?.product?.size ?? "M",
          image: order?.product?.image ?? "https://via.placeholder.com/64x64/f0f0f0/999999?text=Adidas",
        },
        seller: {
          name: order?.seller?.name ?? "Cathy",
          avatar: order?.seller?.avatar,
        },
        buyer: {
          name: order?.buyer?.name ?? "Cindy",
          avatar: order?.buyer?.avatar,
        },
        status: order?.status ?? "CANCELLED",
        listing_id: order?.listing_id ?? 41, // 🔥 确保有listing_id
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

  // 生成系统消息的函数 - 根据用户角色显示不同内容
  const generateSystemMessage = (oldStatus: string, newStatus: string, order: Order): ChatItem | null => {
    const timestamp = new Date().toLocaleTimeString();
    
    // 🔥 判断当前用户是否为卖家
    const isSeller = (conversation?.conversation as any)?.participant_id === user?.id;
    
    // 🔥 特殊处理：DELIVERED -> COMPLETED (Mark as Received)
    if (oldStatus === "DELIVERED" && newStatus === "COMPLETED") {
      if (isSeller) {
        return {
          id: `system-received-seller-${Date.now()}`,
          type: "system",
          text: "Buyer confirmed received. Transaction completed.",
          time: timestamp,
          orderId: order.id,
          sentByUser: false
        };
      } else {
        return {
          id: `system-received-buyer-${Date.now()}`,
          type: "system",
          text: "I've confirmed received. Transaction completed.",
          time: timestamp,
          orderId: order.id,
          sentByUser: true
        };
      }
    }
    
    switch (newStatus) {
      case "IN_PROGRESS":
        if (isSeller) {
          return {
            id: `system-paid-seller-${Date.now()}`,
            type: "system",
            text: `${order.buyer?.name || 'Buyer'} has paid for the order.\nPlease prepare the package and ship soon.`,
            time: timestamp,
            orderId: order.id,
            sentByUser: false,
            avatar: order.buyer?.avatar
          };
        } else {
          return {
            id: `system-paid-buyer-${Date.now()}`,
            type: "system",
            text: "I've paid, waiting for you to ship\nPlease pack the item and ship to the address I provided on TOP.",
            time: timestamp,
            orderId: order.id,
            sentByUser: true
          };
        }
      
      case "TO_SHIP":
        if (isSeller) {
          return {
            id: `system-prepare-seller-${Date.now()}`,
            type: "system",
            text: "Order confirmed. Please prepare the package and ship soon.",
            time: timestamp,
            orderId: order.id
          };
        } else {
          return {
            id: `system-prepare-buyer-${Date.now()}`,
            type: "system",
            text: "Order confirmed. Seller is preparing to ship.",
            time: timestamp,
            orderId: order.id
          };
        }
      
      case "SHIPPED":
        if (isSeller) {
          return {
            id: `system-shipped-seller-${Date.now()}`,
            type: "system",
            text: "You have shipped the parcel.",
            time: timestamp,
            orderId: order.id
          };
        } else {
          return {
            id: `system-shipped-buyer-${Date.now()}`,
            type: "system",
            text: "Seller has shipped your parcel.",
            time: timestamp,
            orderId: order.id
          };
        }
      
      case "DELIVERED":
        if (isSeller) {
          return {
            id: `system-delivered-seller-${Date.now()}`,
            type: "system",
            text: "Parcel delivered. Waiting for buyer to confirm received.",
            time: timestamp,
            orderId: order.id
          };
        } else {
          return {
            id: `system-delivered-buyer-${Date.now()}`,
            type: "system",
            text: "Parcel arrived. Waiting for buyer to confirm received.",
            time: timestamp,
            orderId: order.id
          };
        }
      
      case "RECEIVED":
        if (isSeller) {
          return {
            id: `system-received-seller-${Date.now()}`,
            type: "system",
            text: "Buyer confirmed received. Transaction completed.",
            time: timestamp,
            orderId: order.id
          };
        } else {
          return {
            id: `system-received-buyer-${Date.now()}`,
            type: "system",
            text: "Order confirmed received. Transaction completed.",
            time: timestamp,
            orderId: order.id
          };
        }
      
      case "CANCELLED":
        // 🔥 使用统一的"I've cancelled this order."格式，通过renderSystem动态转换
        return {
          id: `system-cancelled-${Date.now()}`,
          type: "system",
          text: "I've cancelled this order.",
          time: timestamp,
          orderId: order.id,
          senderInfo: {
            // 需要根据实际情况设置，这里暂时不设置，让renderSystem处理
            id: user?.id || 0,
            username: user?.username || "",
            avatar: user?.avatar_url || ""
          }
        };
      
      case "COMPLETED":
        if (isSeller) {
          return {
            id: `system-completed-seller-${Date.now()}`,
            type: "system",
            text: "Order completed successfully.",
            time: timestamp,
            orderId: order.id
          };
        } else {
          return {
            id: `system-completed-buyer-${Date.now()}`,
            type: "system",
            text: "Order completed successfully.",
            time: timestamp,
            orderId: order.id
          };
        }
      
      case "REVIEWED":
        if (isSeller) {
          return {
            id: `system-reviewed-seller-${Date.now()}`,
            type: "system",
            text: "Buyer has submitted a review.",
            time: timestamp,
            orderId: order.id
          };
        } else {
          return {
            id: `system-reviewed-buyer-${Date.now()}`,
            type: "system",
            text: "Review submitted. Thank you for your feedback!",
            time: timestamp,
            orderId: order.id
          };
        }
      
      default:
        return null;
    }
  };

  const loadConversationData = async () => {
    if (!conversationId) {
      // 如果没有 conversationId，但有订单信息，显示订单卡片
      if (kind === "order" && order) {
        console.log("🔍 No conversationId but have order, showing order card");
        const orderCard: ChatItem = {
          id: `order-card-${order.id}`,
          type: "orderCard",
          order: order
        };
        
        // 🔥 根据订单状态生成系统消息
        const isSeller = false; // 从CheckoutScreen进入的都是买家
        const systemMessages = generateOrderSystemMessages(order, isSeller);
        
        setItems([orderCard, ...systemMessages]);
        
        // 🔥 尝试创建对话并保存系统消息
        const createConversationAndSaveMessages = async () => {
          try {
            if (order && order.seller) {
              const sellerId = order.seller.id || order.seller.user_id;
              const listingId = order.listing_id || order.product?.listing_id;
              
              if (sellerId) {
                // 创建对话
                const newConversation = await messagesService.createConversation({
                  participant_id: sellerId,
                  listing_id: listingId,
                  type: 'ORDER'
                });
                
                console.log("✅ New conversation created for system messages:", newConversation);
                
                // 保存系统消息
                if (newConversation && newConversation.id) {
                  for (const systemMsg of systemMessages) {
                    if (systemMsg.type === "system" && "text" in systemMsg) {
                      try {
                        await messagesService.sendMessage(newConversation.id.toString(), {
                          content: systemMsg.text,
                          message_type: "SYSTEM"
                        });
                        console.log("✅ System message saved to new conversation:", systemMsg.text);
                      } catch (error) {
                        console.error("❌ Failed to save system message:", error);
                      }
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error("❌ Failed to create conversation for system messages:", error);
          }
        };
        
        // 延迟创建对话和保存消息
        setTimeout(createConversationAndSaveMessages, 1000);
        return;
      }
      
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
            sentByUser: msg.sentByUser, // 🔥 添加 sentByUser 字段
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
        // 订单聊天：在开头添加商品卡片和系统消息
        console.log("🔍 订单聊天，添加商品卡片和系统消息");
        
        // 优先使用 route.params.order，如果没有则使用 conversation.order
        const orderData = order || conversation?.order;
        console.log("🔍 Order 数据来源:", order ? "route.params" : "conversation");
        console.log("🔍 Order 数据:", JSON.stringify(orderData, null, 2));
        
        if (orderData) {
          // 🔥 判断当前用户是否为卖家
          const isSeller = (conversation?.conversation as any)?.participant_id === user?.id;
          
          const orderCard: ChatItem = {
            id: "order-card-" + orderData.id,
            type: "orderCard",
            order: {
              id: orderData.id,
              product: {
                title: orderData.product.title,
                price: orderData.product.price,
                size: orderData.product.size,
                image: orderData.product.image,
                shippingFee: orderData.product.shippingFee
              },
              seller: {
                name: orderData.seller.name,
                avatar: orderData.seller.avatar
              },
              buyer: orderData.buyer ? {
                name: orderData.buyer.name,
                avatar: orderData.buyer.avatar
              } : undefined,
              status: orderData.status === "Active" ? "COMPLETED" : (orderData.status || "Inquiry"),
              listing_id: orderData.listing_id
            }
          };
          
          // 🔥 根据订单状态生成系统消息
          const systemMessages = generateOrderSystemMessages(orderData, isSeller, true); // 🔥 跳过 paid 消息
          
          console.log("🔍 创建的商品卡片:", JSON.stringify(orderCard, null, 2));
          console.log("🔍 生成的系统消息:", JSON.stringify(systemMessages, null, 2));
          
          // 🔥 检查是否需要添加Review CTA卡片
          // 1. 如果订单状态是COMPLETED，直接添加
          // 2. 如果系统消息中有"Transaction complete"但没有Review CTA，也要添加
          const hasTransactionComplete = systemMessages.some(msg => 
            msg.type === "system" && msg.text.includes("Transaction complete")
          );
          const hasReviewCta = systemMessages.some(msg => msg.type === "reviewCta");
          
          if (orderData.status === "COMPLETED" || (hasTransactionComplete && !hasReviewCta)) {
            const reviewCtaMessage: ChatItem = {
              id: `review-cta-${orderData.id}`,
              type: "reviewCta",
              text: "How was your experience? Leave a review to help others discover great items.",
              orderId: orderData.id.toString(),
              reviewType: isSeller ? "seller" : "buyer"
            };
            systemMessages.push(reviewCtaMessage);
            console.log("🔍 Added Review CTA for COMPLETED order:", reviewCtaMessage);
            console.log("🔍 Trigger reason:", orderData.status === "COMPLETED" ? "Order status COMPLETED" : "Transaction complete message found");
          }
          
          // 检查是否已经有商品卡片，避免重复
          const hasOrderCard = apiItems.some(item => item.type === "orderCard");
          if (!hasOrderCard) {
            // 🔥 组合商品卡片和系统消息
            const orderItems = [orderCard, ...systemMessages];
            finalItems = [...orderItems, ...apiItems];
            console.log("🔍 添加了商品卡片和系统消息，总消息数量:", finalItems.length);
            
            // 🔥 将系统消息保存到数据库
            const saveSystemMessages = async () => {
              for (const systemMsg of systemMessages) {
                if (systemMsg.type === "system" && "text" in systemMsg) {
                  try {
                    await messagesService.sendMessage(conversationId.toString(), {
                      content: systemMsg.text,
                      message_type: "SYSTEM"
                    });
                    console.log("✅ System message saved to database:", systemMsg.text);
                  } catch (error) {
                    console.error("❌ Failed to save system message:", error);
                  }
                }
              }
            };
            
            // 延迟保存系统消息，确保对话数据加载完成
            setTimeout(saveSystemMessages, 500);
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
        console.log("🔍 Final items before setItems:", finalItems);
        console.log("🔍 Final items length:", finalItems.length);
        
        // 🔥 额外检查：如果消息中有"Transaction complete"但没有Review CTA，添加一个
        const hasTransactionComplete = finalItems.some(item => 
          item.type === "system" && item.text.includes("Transaction complete")
        );
        const hasReviewCta = finalItems.some(item => item.type === "reviewCta");
        const orderCard = finalItems.find(item => item.type === "orderCard");
        
        if (hasTransactionComplete && !hasReviewCta && orderCard && orderCard.type === "orderCard") {
          // 判断用户角色：如果订单有seller信息且当前用户是卖家，则为seller，否则为buyer
          const isCurrentUserSeller = orderCard.order.seller && user?.username === orderCard.order.seller.name;
          const reviewCtaMessage: ChatItem = {
            id: `review-cta-${orderCard.order.id}`,
            type: "reviewCta",
            text: "How was your experience? Leave a review to help others discover great items.",
            orderId: orderCard.order.id.toString(),
            reviewType: isCurrentUserSeller ? "seller" : "buyer"
          };
          finalItems.push(reviewCtaMessage);
          console.log("🔍 Added missing Review CTA after detecting Transaction complete:", reviewCtaMessage);
        }
        
        setItems(finalItems);
        console.log("🔍 Loaded", finalItems.length, "messages from API");
        
        // 🔥 记录当前订单状态
        if (orderCard && orderCard.type === "orderCard") {
          setLastOrderStatus(orderCard.order.status);
          console.log("🔍 Recorded order status:", orderCard.order.status);
          
          // 🔥 检查评论状态
          const orderId = orderCard.order.id.toString();
          checkOrderReviewStatus(orderId);
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
      // 🔥 使用正确的listing_id，如果没有则从conversation中获取
      let listingId = o.listing_id;
      
      // 如果没有listing_id，尝试从conversation中获取
      if (!listingId && conversation?.listing?.id) {
        listingId = conversation.listing.id;
      }
      
      // 如果还是没有，使用Adidas jumper的ID
      if (!listingId) {
        console.warn("⚠️ No listing_id found, using Adidas jumper ID");
        listingId = 41; // 使用Adidas jumper的ID
      }
      
      console.log("🛒 Buy Now clicked for listing:", listingId);
      console.log("🛒 Order listing_id:", o.listing_id);
      console.log("🛒 Conversation listing_id:", (conversation as any)?.listing?.id);
      
      // 🔥 跳转到CheckoutScreen而不是直接创建订单
      const rootNavigation = (navigation as any).getParent?.();
      if (rootNavigation) {
        // 构造单个商品的购物车项目格式
        const singleItem = {
          item: {
            id: listingId.toString(), // 🔥 使用listing_id
            title: o.product.title, // 🔥 修复：使用title而不是name
            name: o.product.title, // 保持兼容性
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
            shipping: o.product.shippingFee || 0, // 使用商品的真实运费
            conversationId: conversationId // 🔥 传递 conversationId
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
                  
                  // 发送系统消息 - 买家视角
                  const systemMessage: ChatItem = {
                    id: `system-cancel-${Date.now()}`,
                    type: "system",
                    text: "I've cancelled this order.",
                    time: new Date().toLocaleTimeString(),
                    orderId: o.id,
                    sentByUser: true,
                    senderInfo: {
                      id: user?.id || 0,
                      username: user?.username || "",
                      avatar: user?.avatar_url || ""
                    }
                  };
                  setItems(prev => [...prev, systemMessage]);
                  
                  // 🔥 保存 Cancel 系统消息到数据库
                  if (conversationId) {
                    try {
                      await messagesService.sendMessage(conversationId.toString(), {
                        content: systemMessage.text,
                        message_type: "SYSTEM"
                      });
                      console.log("✅ Cancel system message saved to database");
                    } catch (error) {
                      console.error("❌ Failed to save cancel system message:", error);
                    }
                  }
                  
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
        // 🔥 更新订单状态为COMPLETED（买家确认收货）
        await ordersService.updateOrderStatus(parseInt(o.id), { status: "COMPLETED" });
        
        // 更新聊天中的订单状态
        const updatedItems = items.map(item => {
          if (item.type === "orderCard" && item.order.id === o.id) {
            return {
              ...item,
              order: { ...item.order, status: "COMPLETED" }
            };
          }
          return item;
        });
        setItems(updatedItems);
        
        // 🔥 发送正确的系统消息
        const systemMessage: ChatItem = {
          id: `system-received-${Date.now()}`,
          type: "system",
          text: "I've confirmed received. Transaction completed.",
          time: new Date().toLocaleTimeString(),
          orderId: o.id
        };
        setItems(prev => [...prev, systemMessage]);
        
        // 🔥 发送Review CTA卡片
        const reviewCtaMessage: ChatItem = {
          id: `cta-review-${Date.now()}`,
          type: "reviewCta",
          text: "How was your experience? Leave a review to help others discover great items.",
          orderId: o.id,
          reviewType: "buyer"
        };
        console.log("🔍 Adding Review CTA message:", reviewCtaMessage);
        setItems(prev => {
          const newItems = [...prev, reviewCtaMessage];
          console.log("🔍 Updated items count:", newItems.length);
          console.log("🔍 Last item type:", newItems[newItems.length - 1]?.type);
          return newItems;
        });
        
        Alert.alert("Success", "Order has been marked as received.");
      } catch (error) {
        console.error("Error marking order as received:", error);
        Alert.alert("Error", "Failed to update order status. Please try again.");
      }
    };

    const handleLeaveReview = () => {
      console.log("⭐ Leave Review button pressed for order:", o.id);
      console.log("⭐ Order ID:", o.id);
      
      try {
        // 获取 root navigation (需要通过多层 getParent)
        let rootNav = navigation;
        while ((rootNav as any).getParent) {
          const parent = (rootNav as any).getParent();
          if (parent) {
            rootNav = parent;
          } else {
            break;
          }
        }
        
        console.log("⭐ Root navigation found, navigating to Review screen");
        (rootNav as any).navigate("Review", { 
          orderId: o.id,
          reviewType: "buyer" // 买家视角
        });
      } catch (error) {
        console.error("❌ Error navigating to Review:", error);
        Alert.alert("Error", "Failed to navigate to review screen");
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
                  
                  // 发送系统消息 - 卖家视角
                  const systemMessage: ChatItem = {
                    id: `system-cancel-sold-${Date.now()}`,
                    type: "system",
                    text: "I've cancelled this order.",
                    time: new Date().toLocaleTimeString(),
                    orderId: o.id,
                    sentByUser: true,
                    senderInfo: {
                      id: user?.id || 0,
                      username: user?.username || "",
                      avatar: user?.avatar_url || ""
                    }
                  };
                  setItems(prev => [...prev, systemMessage]);
                  
                  // 🔥 保存 Cancel 系统消息到数据库
                  if (conversationId) {
                    try {
                      await messagesService.sendMessage(conversationId.toString(), {
                        content: systemMessage.text,
                        message_type: "SYSTEM"
                      });
                      console.log("✅ Cancel system message saved to database");
                    } catch (error) {
                      console.error("❌ Failed to save cancel system message:", error);
                    }
                  }
                  
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
          <Text style={styles.orderStatus}>
            Status: {isSeller && o.status === "IN_PROGRESS" ? "To Ship" : getDisplayStatus(o.status)}
          </Text>
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
              {/* IN_PROGRESS/TO_SHIP状态 - Cancel Order按钮（Mark as Shipped移到SoldTab管理） */}
              {["IN_PROGRESS", "TO_SHIP"].includes(o.status) && (
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: "#F54B3D" }]}
                  onPress={handleCancelSold}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>Cancel Order</Text>
                </TouchableOpacity>
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
              {!["IN_PROGRESS", "TO_SHIP", "COMPLETED", "REVIEWED"].includes(o.status) && (
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
      const isMine = senderInfo?.id === user?.id;
      
      console.log("🔍 renderSystem debug:", {
        text: text.substring(0, 20) + "...",
        sentByUser,
        isMine,
        senderInfoId: senderInfo?.id,
        currentUserId: user?.id,
        senderInfoAvatar: senderInfo?.avatar,
        avatar: avatar,
        senderInfo: senderInfo?.avatar ? "has avatar" : "no avatar"
      });

      const bubbleStyle = isMine ? styles.userCardBubble : styles.userCardBubbleBuyer;
      const avatarSource = senderInfo?.avatar 
        ? { uri: senderInfo.avatar }
        : avatar
        ? { uri: avatar }
        : ASSETS.avatars.default;

      return (
        <>
          {time ? <Text style={styles.time}>{time}</Text> : null}
          <View style={[
            styles.systemMessageRow,
            { 
              justifyContent: isMine ? "flex-end" : "flex-start",
              alignItems: "flex-start" // 🔥 改为顶部对齐
            }
          ]}>
            {/* 🔥 如果不是我的消息，在左侧显示发送者头像 */}
            {!isMine && (
              <Image
                source={avatarSource}
                style={[styles.avatar, { marginRight: 6 }]}
              />
            )}
            <View style={bubbleStyle}>
              <Text style={styles.userCardTitle}>{title}</Text>
              <View style={styles.userCardDivider} />
              <Text style={styles.userCardSubtitle}>{subtitle}</Text>
            </View>
            {/* 🔥 如果是我的消息，在右侧显示我的头像 */}
            {isMine && (
              <Image
                source={avatarSource}
                style={[styles.avatar, { marginLeft: 6 }]}
              />
            )}
          </View>
        </>
      );
    }

    // 🔥 动态转换系统消息的显示内容
    let displayText = text;
    
    // 订单创建消息的动态转换
    if (text.includes("I've paid, waiting for you to ship")) {
      // 判断当前用户是否是发送者（买家）
      const isCurrentUserSender = senderInfo?.id === user?.id;
      
      if (isCurrentUserSender) {
        // 如果是发送者（买家），显示操作者视角
        displayText = "I've paid, waiting for you to ship\nPlease pack the item and ship to the address I provided on TOP.";
      } else {
        // 如果不是发送者（卖家），显示接收者视角
        displayText = "Buyer has paid for the order\nPlease pack the item and ship to the address provided on TOP.";
      }
    }
    
    // 取消消息的动态转换
    if (text === "I've cancelled this order." || text.includes("cancelled")) {
      // 判断当前用户是否是发送者
      const isCurrentUserSender = senderInfo?.id === user?.id;
      
      if (isCurrentUserSender) {
        // 如果是发送者，显示操作者视角
        displayText = "I've cancelled this order.";
      } else {
        // 如果不是发送者，显示接收者视角
        // 需要判断谁取消了订单：通过senderInfo或order对象
        let isCancellerBuyer = false;
        
        if (senderInfo?.id) {
          // 如果有senderInfo，使用senderInfo来判断
          isCancellerBuyer = senderInfo.id === order?.buyer_id;
        } else if (order) {
          // 如果没有senderInfo但order存在，使用conversation信息判断
          const isCurrentUserBuyer = (conversation?.conversation as any)?.initiator_id === user?.id;
          // 如果当前用户是买家，取消者是卖家；反之亦然
          isCancellerBuyer = !isCurrentUserBuyer;
        }
        
        displayText = isCancellerBuyer 
          ? "Buyer has cancelled the order."
          : "Seller has cancelled the order.";
      }
    }
    
    // 发货消息的动态转换
    if (text === "Seller has shipped your parcel.") {
      // 判断当前用户是否是发送者（卖家）
      const isCurrentUserSender = senderInfo?.id === user?.id;
      
      if (isCurrentUserSender) {
        // 如果是发送者（卖家），显示操作者视角
        displayText = "You have shipped the parcel.";
      }
      // 如果不是发送者（买家），保持原文本 "Seller has shipped your parcel."
    }
    
    // 订单确认收到消息的动态转换
    if (text === "Order confirmed received. Transaction completed.") {
      // 判断当前用户是否是发送者（买家）
      const isCurrentUserSender = senderInfo?.id === user?.id;
      
      if (isCurrentUserSender) {
        // 如果是发送者（买家），显示操作者视角
        displayText = "I've confirmed received. Transaction completed.";
      } else {
        // 如果不是发送者（卖家），显示接收者视角
        displayText = "Buyer confirmed received. Transaction completed.";
      }
    }
    
    // 包裹到达消息的动态转换
    if (text === "Parcel arrived. Waiting for buyer to confirm received.") {
      // 判断当前用户是否是发送者（卖家）
      const isCurrentUserSender = senderInfo?.id === user?.id;
      
      if (isCurrentUserSender) {
        // 如果是发送者（卖家），显示操作者视角
        displayText = "Parcel arrived. Waiting for buyer to confirm received.";
      } else {
        // 如果不是发送者（买家），显示接收者视角
        displayText = "Parcel arrived. Please confirm received.";
      }
    }

    // 其他系统提示（物流状态等）维持灰框样式，居中显示
    return (
      <>
        {time ? <Text style={styles.time}>{time}</Text> : null}
        <View style={styles.systemMessageRow}>
          <View style={styles.systemBox}>
            <Text style={styles.systemText}>{displayText}</Text>
          </View>
        </View>
      </>
    );
  };

  const renderReviewCTA = (orderId: string, text: string, reviewType?: "buyer" | "seller") => {
    const status = reviewStatuses[orderId];
    
    // 如果用户已经评论过，显示 "Already Reviewed" 卡片
    if (status?.hasUserReviewed) {
      return (
        <View style={styles.reviewBox}>
          <Text style={styles.reviewHint}>✅ You already reviewed this transaction</Text>
          <TouchableOpacity 
            style={[styles.reviewBtnCenter, { backgroundColor: "#666" }]}
            onPress={() => {
              console.log("⭐ View Review pressed for order:", orderId);
              // TODO: 导航到查看评论的页面
              Alert.alert("View Review", "This will show your review");
            }}
          >
            <Text style={styles.reviewBtnText}>View Your Review</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // 如果对方已经评论过，显示 "Reply to Review" 卡片
    if (status?.hasOtherReviewed) {
      // 🔥 获取对方用户名
      const orderCard = items.find(item => item.type === "orderCard" && item.order.id === orderId);
      let otherPersonName = "The other person";
      
      if (orderCard && orderCard.type === "orderCard") {
        // 判断当前用户是 buyer 还是 seller
        // 通过用户名匹配
        const isBuyer = user?.username === orderCard.order.buyer?.name;
        if (isBuyer) {
          // 当前用户是买家，对方是卖家
          otherPersonName = orderCard.order.seller?.name || "The seller";
        } else {
          // 当前用户是卖家，对方是买家
          otherPersonName = orderCard.order.buyer?.name || "The buyer";
        }
      }
      
      return (
        <View style={styles.reviewBox}>
          <Text style={styles.reviewHint}>{otherPersonName} has reviewed this transaction</Text>
          <TouchableOpacity 
            style={styles.reviewBtnCenter}
            onPress={() => {
              console.log("⭐ Reply to Review button pressed for order:", orderId);
              console.log("⭐ Review type:", reviewType || "buyer");
              
              const rootNavigation = (navigation as any).getParent?.();
              if (rootNavigation) {
                console.log("⭐ Root navigation found, navigating to Review screen");
                rootNavigation.navigate("Review", { 
                  orderId: orderId,
                  reviewType: reviewType || "buyer",
                  isReply: true
                });
              } else {
                console.log("⭐ Trying direct navigation");
                (navigation as any).navigate("Review", { 
                  orderId: orderId,
                  reviewType: reviewType || "buyer",
                  isReply: true
                });
              }
            }}
          >
            <Text style={styles.reviewBtnText}>Leave Review</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // 默认显示 "Leave Review" 卡片
    return (
      <View style={styles.reviewBox}>
        <Text style={styles.reviewHint}>{text}</Text>
        <TouchableOpacity 
          style={styles.reviewBtnCenter}
          onPress={() => {
            console.log("⭐ Leave Review button pressed for order:", orderId);
            console.log("⭐ Review type:", reviewType || "buyer");
            
            const rootNavigation = (navigation as any).getParent?.();
            if (rootNavigation) {
              console.log("⭐ Root navigation found, navigating to Review screen");
              rootNavigation.navigate("Review", { 
                orderId: orderId,
                reviewType: reviewType || "buyer"
              });
            } else {
              console.log("⭐ Trying direct navigation");
              (navigation as any).navigate("Review", { 
                orderId: orderId,
                reviewType: reviewType || "buyer"
              });
            }
          }}
        >
          <Text style={styles.reviewBtnText}>Leave Review</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // 🔥 渲染评论回复邀请卡片
  const renderReviewReplyCTA = (orderId: string, text: string, reviewType?: "buyer" | "seller") => (
    <View style={styles.reviewBox}>
      <Text style={styles.reviewHint}>{text}</Text>
      <TouchableOpacity 
        style={styles.reviewBtnCenter}
        onPress={() => {
          console.log("⭐ Reply to Review button pressed for order:", orderId);
          const rootNavigation = (navigation as any).getParent?.();
          if (rootNavigation) {
            rootNavigation.navigate("Main", {
              screen: "MyTop",
              params: {
                screen: "Review",
                params: { 
                  orderId: orderId,
                  reviewType: reviewType || "buyer",
                  isReply: true
                }
              }
            });
          }
        }}
      >
        <Text style={styles.reviewBtnText}>Reply to Review</Text>
      </TouchableOpacity>
    </View>
  );

  // 🔥 渲染互评查看卡片
  const renderMutualReviewCTA = (orderId: string, text: string) => (
    <View style={styles.reviewBox}>
      <Text style={styles.reviewHint}>{text}</Text>
      <TouchableOpacity 
        style={styles.reviewBtnCenter}
        onPress={() => {
          console.log("⭐ View Mutual Review button pressed for order:", orderId);
          const rootNavigation = (navigation as any).getParent?.();
          if (rootNavigation) {
            rootNavigation.navigate("Main", {
              screen: "MyTop",
              params: {
                screen: "MutualReview",
                params: { 
                  orderId: orderId
                }
              }
            });
          }
        }}
      >
        <Text style={styles.reviewBtnText}>View Mutual Review</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header 
        title={sender} 
        showBack 
        onBackPress={() => {
          console.log("🔙 Back button pressed in ChatScreen");
          
          // 🔍 调试：检查当前导航状态
          const state = navigation.getState();
          console.log("🔍 Current navigation state:", JSON.stringify(state, null, 2));
          console.log("🔍 Current route name:", state.routes[state.index]?.name);
          console.log("🔍 Can go back:", navigation.canGoBack());
          
          // 🔥 兜底逻辑：确保能正确返回到 InboxScreen
          if (navigation.canGoBack()) {
            console.log("🔙 Going back via navigation.goBack()");
            navigation.goBack(); // ✅ 正常返回到 InboxScreen
          } else {
            console.log("🔙 Cannot go back, navigating to InboxMain");
            navigation.navigate("InboxMain"); // ✅ 兜底跳转到 InboxMain
          }
        }}
      />

      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 12 }}
        renderItem={({ item }) => {
          if (item.type === "orderCard") {
            // 🔥 判断订单卡片应该显示在左侧还是右侧
            // 如果当前用户是买家，订单卡片应该显示在右侧
            const isBuyer = (conversation?.conversation as any)?.initiator_id === user?.id;
            const cardPosition = isBuyer ? "flex-end" : "flex-start";
            
            return (
              <View style={{ 
                marginBottom: 12, 
                alignItems: cardPosition,
                paddingHorizontal: 8
              }}>
                {renderOrderCard(item.order)}
              </View>
            );
          }
          if (item.type === "system")
            return <View style={{ marginBottom: 12 }}>{renderSystem(item)}</View>;
          if (item.type === "reviewCta") {
            console.log("🔍 Rendering reviewCta:", item);
            return <View style={{ marginBottom: 12 }}>{renderReviewCTA(item.orderId, item.text, item.reviewType)}</View>;
          }
          if (item.type === "reviewReplyCta")
            return <View style={{ marginBottom: 12 }}>{renderReviewReplyCTA(item.orderId, item.text, item.reviewType)}</View>;
          if (item.type === "mutualReviewCta")
            return <View style={{ marginBottom: 12 }}>{renderMutualReviewCTA(item.orderId, item.text)}</View>;

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
  systemMessageRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
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
  reviewHint: { color: "#555", fontSize: 14, marginBottom: 12, lineHeight: 20, textAlign: "center" },
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