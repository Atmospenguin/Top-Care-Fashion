import { apiClient } from './api';

export interface Conversation {
  id: string;
  sender: string;
  message: string;
  time: string;
  avatar: { uri: string } | null;
  kind: 'support' | 'order' | 'general';
  unread: boolean;
  lastFrom: 'support' | 'seller' | 'buyer' | 'me';
  order?: {
    id: string;
    product: {
      title: string;
      price: number;
      size?: string;
      image: string | null;
    };
    seller: { name: string };
    status: string;
  } | null;
}

export interface Message {
  id: string;
  type: 'msg' | 'system' | 'orderCard';
  sender?: 'me' | 'other';
  text: string;
  time: string;
  senderInfo?: {
    id: number;
    username: string;
    avatar: string | null;
  };
  order?: {
    id: string;
    product: {
      title: string;
      price: number;
      size?: string;
      image: string | null;
    };
    seller: { name: string };
    status: string;
  };
}

export interface ConversationDetail {
  conversation: {
    id: number;
    type: string;
    initiator_id?: number; // 🔥 添加initiator_id字段
    participant_id?: number; // 🔥 添加participant_id字段
    otherUser: {
      id: number;
      username: string;
      avatar: string | null;
    };
  };
  messages: Message[];
  order?: {
    id: string;
    product: {
      title: string;
      price: number;
      size?: string;
      image: string | null;
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
  };
}

export interface CreateConversationParams {
  participant_id: number;
  listing_id?: number;
  type?: 'ORDER' | 'SUPPORT' | 'GENERAL';
}

export interface SendMessageParams {
  content: string;
  message_type?: 'TEXT' | 'IMAGE' | 'SYSTEM';
}

class MessagesService {
  // 获取所有对话
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await apiClient.get('/api/conversations');
      return response.data.conversations;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  // 获取特定对话的消息
  async getMessages(conversationId: string): Promise<ConversationDetail> {
    try {
      const response = await apiClient.get(`/api/messages/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  // 创建新对话
  async createConversation(params: CreateConversationParams): Promise<any> {
    try {
      const response = await apiClient.post('/api/conversations', params);
      return response.data.conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // 发送消息
  async sendMessage(conversationId: string, params: SendMessageParams): Promise<Message> {
    try {
      const response = await apiClient.post(`/api/messages/${conversationId}`, params);
      return response.data.message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // 删除对话
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      console.log('🗑️ Frontend: Deleting conversation:', conversationId);
      console.log('🗑️ Frontend: ConversationId type:', typeof conversationId);
      
      const response = await apiClient.delete('/api/conversations', {
        data: { conversationId }
      });
      
      console.log('✅ Frontend: Delete response:', response);
    } catch (error) {
      console.error('❌ Frontend: Error deleting conversation:', error);
      throw error;
    }
  }

  // 获取或创建与卖家的对话（用于商品页面）
  async getOrCreateSellerConversation(sellerId: number, listingId?: number): Promise<Conversation> {
    try {
      // 先尝试获取现有对话
      const conversations = await this.getConversations();
      const existingConversation = conversations.find(conv => 
        conv.kind === 'order' && 
        conv.order?.seller.name && 
        conv.order.seller.name === sellerId.toString() &&
        (listingId ? conv.order?.id === listingId.toString() : true)
      );

      if (existingConversation) {
        return existingConversation;
      }

      // 创建新对话
      const newConversation = await this.createConversation({
        participant_id: sellerId,
        listing_id: listingId,
        type: 'ORDER'
      });

      console.log("✅ New conversation created:", newConversation);

      // 🔥 直接使用创建返回的对话数据，构建前端需要的格式
      const otherUser = newConversation.participant;
      return {
        id: newConversation.id.toString(),
        sender: otherUser.username,
        message: "No messages yet",
        time: "Now",
        avatar: otherUser.avatar_url ? { uri: otherUser.avatar_url } : null,
        kind: "order",
        unread: false,
        lastFrom: "other",
        order: newConversation.listing ? {
          id: newConversation.listing.id.toString(),
          product: {
            title: newConversation.listing.name,
            price: Number(newConversation.listing.price),
            size: newConversation.listing.size,
            image: newConversation.listing.image_url || (newConversation.listing.image_urls as any)?.[0] || null
          },
          seller: { 
            name: otherUser.username,
            avatar: otherUser.avatar_url 
          },
          status: "Inquiry"
        } : {
          id: listingId?.toString() || "unknown",
          product: {
            title: "Item",
            price: 0,
            size: "Unknown",
            image: null
          },
          seller: { 
            name: otherUser.username,
            avatar: otherUser.avatar_url 
          },
          status: "Inquiry"
        }
      };
    } catch (error) {
      console.error('Error getting or creating seller conversation:', error);
      throw error;
    }
  }
}

export const messagesService = new MessagesService();