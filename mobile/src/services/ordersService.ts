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
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.ORDERS, data);
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

  // Helper methods for common order operations
  async cancelOrder(orderId: number): Promise<Order> {
    return this.updateOrderStatus(orderId, { status: 'CANCELLED' });
  }

  async markAsShipped(orderId: number): Promise<Order> {
    return this.updateOrderStatus(orderId, { status: 'SHIPPED' });
  }

  async markAsReceived(orderId: number): Promise<Order> {
    return this.updateOrderStatus(orderId, { status: 'RECEIVED' });
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
