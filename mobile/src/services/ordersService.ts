import { apiClient } from './api';
import { API_CONFIG } from '../config/api';

export interface Order {
  id: number;
  buyer_id: number;
  seller_id: number;
  listing_id: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  // 订单金额和编号
  total_amount?: number;
  order_number?: string;
  // 买家信息字段
  buyer_name?: string;
  buyer_phone?: string;
  shipping_address?: string;
  payment_method?: string;
  payment_details?: any;
  // 对话信息
  conversations?: Array<{
    id: number;
  }>;
  conversationId?: string | null;
  // 评论信息
  reviews?: Array<{
    id: number;
    reviewer_id: number;
    rating: number;
    comment: string;
    created_at: string;
  }>;
  buyer: {
    id: number;
    username: string;
    avatar_url?: string;
    avatar_path?: string;
    email?: string;
    phone_number?: string;
  };
  seller: {
    id: number;
    username: string;
    avatar_url?: string;
    avatar_path?: string;
    email?: string;
    phone_number?: string;
  };
  listing: {
    id: number;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    image_urls?: string[];
    brand?: string;
    size?: string;
    condition_type: string;
    material?: string;
    weight?: number;
    dimensions?: string;
  };
  reviews: Review[];
}

export interface Review {
  id: number;
  order_id: number;
  reviewer_id: number;
  reviewee_id: number;
  rating: number;
  comment?: string;
  created_at: string;
  reviewer: {
    id: number;
    username: string;
    avatar_url?: string;
    avatar_path?: string;
  };
  reviewee: {
    id: number;
    username: string;
    avatar_url?: string;
    avatar_path?: string;
  };
}

export type OrderStatus = 
  | 'IN_PROGRESS' 
  | 'TO_SHIP' 
  | 'SHIPPED' 
  | 'DELIVERED' 
  | 'RECEIVED' 
  | 'COMPLETED' 
  | 'REVIEWED' 
  | 'CANCELLED';

export interface OrdersQueryParams {
  type?: 'bought' | 'sold';
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateOrderRequest {
  listing_id: number;
  buyer_name?: string;
  buyer_phone?: string;
  shipping_address?: string;
  payment_method?: string;
  payment_details?: {
    brand?: string;
    last4?: string;
    expiry?: string;
    cvv?: string;
  };
}

export interface UpdateOrderRequest {
  status: OrderStatus;
}

export interface CreateReviewRequest {
  rating: number;
  comment?: string;
}

class OrdersService {
  // Get user's orders
  async getOrders(params: OrdersQueryParams = {}): Promise<OrdersResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.type) searchParams.append('type', params.type);
    if (params.status) searchParams.append('status', params.status);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.ORDERS}?${searchParams.toString()}`);
    return response.data;
  }

  // Get a specific order
  async getOrder(orderId: number): Promise<Order> {
    const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.ORDERS}/${orderId}`);
    return response.data;
  }

  // Create a new order
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    console.log("🔍 Creating order with data:", data);
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.ORDERS, data);
    console.log("✅ Order created successfully:", response.data);
    return response.data;
  }

  // Update order status
  async updateOrderStatus(orderId: number, data: UpdateOrderRequest): Promise<Order> {
    const response = await apiClient.patch(`${API_CONFIG.ENDPOINTS.ORDERS}/${orderId}`, data);
    return response.data;
  }

  // Get reviews for an order
  async getOrderReviews(orderId: number): Promise<Review[]> {
    const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.ORDERS}/${orderId}/reviews`);
    return response.data;
  }

  // Create a review for an order
  async createReview(orderId: number, data: CreateReviewRequest): Promise<Review> {
    const response = await apiClient.post(`${API_CONFIG.ENDPOINTS.ORDERS}/${orderId}/reviews`, data);
    return response.data;
  }

  // Check review status for an order
  async checkReviewStatus(orderId: number): Promise<{
    orderId: number;
    userRole: 'buyer' | 'seller';
    hasUserReviewed: boolean;
    hasOtherReviewed: boolean;
    reviewsCount: number;
    userReview: Review | null;
    otherReview: Review | null;
  }> {
    console.log("⭐ Checking review status for order:", orderId);
    const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.ORDERS}/${orderId}/reviews/check`);
    console.log("⭐ Review status response:", response.data);
    return response.data;
  }

  // Helper methods for common order operations
  async cancelOrder(orderId: number): Promise<Order> {
    return this.updateOrderStatus(orderId, { status: 'CANCELLED' });
  }

  async markAsShipped(orderId: number): Promise<Order> {
    return this.updateOrderStatus(orderId, { status: 'SHIPPED' });
  }

  async markAsReceived(orderId: number): Promise<Order> {
    return this.updateOrderStatus(orderId, { status: 'COMPLETED' });
  }

  async markAsCompleted(orderId: number): Promise<Order> {
    return this.updateOrderStatus(orderId, { status: 'COMPLETED' });
  }

  // Get orders by type (bought/sold)
  async getBoughtOrders(params: Omit<OrdersQueryParams, 'type'> = {}): Promise<OrdersResponse> {
    return this.getOrders({ ...params, type: 'bought' });
  }

  async getSoldOrders(params: Omit<OrdersQueryParams, 'type'> = {}): Promise<OrdersResponse> {
    return this.getOrders({ ...params, type: 'sold' });
  }

  // Get orders by status
  async getOrdersByStatus(status: OrderStatus, params: Omit<OrdersQueryParams, 'status'> = {}): Promise<OrdersResponse> {
    return this.getOrders({ ...params, status });
  }
}

export const ordersService = new OrdersService();
