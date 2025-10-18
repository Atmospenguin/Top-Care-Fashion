import { apiClient } from './api';
import { API_CONFIG } from '../config/api';
import type { User } from './authService';

// 用户资料更新请求
export interface UpdateProfileRequest {
  username?: string;
  avatar?: string;
  bio?: string;
}

// 用户服务类
export class UserService {
  // 获取用户资料
  async getProfile(): Promise<User | null> {
    try {
      const response = await apiClient.get<User>(API_CONFIG.ENDPOINTS.PROFILE);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  // 更新用户资料
  async updateProfile(profileData: UpdateProfileRequest): Promise<User> {
    try {
      const response = await apiClient.put<User>(
        API_CONFIG.ENDPOINTS.PROFILE,
        profileData
      );
      
      if (response.data) {
        return response.data;
      }
      
      throw new Error('Profile update failed');
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // 上传头像
  async uploadAvatar(imageUri: string): Promise<string> {
    try {
      // 创建 FormData 用于文件上传
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      const response = await apiClient.post<{ avatarUrl: string }>(
        `${API_CONFIG.ENDPOINTS.PROFILE}/avatar`,
        formData
      );
      
      if (response.data?.avatarUrl) {
        return response.data.avatarUrl;
      }
      
      throw new Error('Avatar upload failed');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }
}

// 创建单例实例
export const userService = new UserService();
