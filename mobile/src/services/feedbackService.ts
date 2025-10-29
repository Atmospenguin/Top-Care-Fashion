import { apiClient } from './api';
import { API_CONFIG } from '../config/api';

// 反馈类型
export interface Feedback {
  id: string;
  type: 'bug' | 'feature' | 'general';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// 创建反馈请求
export interface CreateFeedbackRequest {
  type: 'bug' | 'feature' | 'general';
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

// 反馈服务类
export class FeedbackService {
  // 获取反馈列表
  async getFeedbacks(): Promise<Feedback[]> {
    try {
      const response = await apiClient.get<{ feedbacks: Feedback[] }>(
        API_CONFIG.ENDPOINTS.FEEDBACK
      );
      
      if (response.data?.feedbacks) {
        return response.data.feedbacks;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      throw error;
    }
  }

  // 创建反馈
  async createFeedback(feedbackData: CreateFeedbackRequest): Promise<Feedback> {
    try {
      const response = await apiClient.post<Feedback>(
        API_CONFIG.ENDPOINTS.FEEDBACK,
        feedbackData
      );
      
      if (response.data) {
        return response.data;
      }
      
      throw new Error('Feedback creation failed');
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw error;
    }
  }

  // 获取反馈标签
  async getFeedbackTags(): Promise<string[]> {
    try {
      const response = await apiClient.get<{ tags: string[] }>(
        `${API_CONFIG.ENDPOINTS.FEEDBACK}/tags`
      );
      
      if (response.data?.tags) {
        return response.data.tags;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching feedback tags:', error);
      throw error;
    }
  }
}

// 创建单例实例
export const feedbackService = new FeedbackService();


