import { apiClient } from './api';

export interface Review {
  id: number;
  order_id: number;
  reviewer_id: number;
  reviewee_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: {
    id: number;
    username: string;
    avatar_url?: string;
    avatar_path?: string;
    isPremium?: boolean;
  };
  reviewee: {
    id: number;
    username: string;
    avatar_url?: string;
    avatar_path?: string;
    isPremium?: boolean;
  };
}

export interface CreateReviewRequest {
  rating: number;
  comment?: string;
  images?: string[];
}

class ReviewsService {
  // 获取订单的评论
  async getOrderReviews(orderId: number): Promise<Review[]> {
    try {
      const response = await apiClient.get<Review[]>(`/api/orders/${orderId}/reviews`);
      if (!response.data) {
        throw new Error('No review data received');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching order reviews:', error);
      throw error;
    }
  }

  // 创建评论
  async createReview(orderId: number, reviewData: CreateReviewRequest): Promise<Review> {
    try {
      const response = await apiClient.post<Review>(`/api/orders/${orderId}/reviews`, reviewData);
      if (!response.data) {
        throw new Error('No review created');
      }
      return response.data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }
}

export const reviewsService = new ReviewsService();
