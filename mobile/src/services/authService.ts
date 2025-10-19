import { apiClient } from './api';
import { API_CONFIG } from '../config/api';

// 用户类型
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

// 登录请求
export interface SignInRequest {
  email: string;
  password: string;
}

// 注册请求
export interface SignUpRequest {
  username: string;
  email: string;
  password: string;
}

// 认证响应
export interface AuthResponse {
  user: User;
  token: string;
}

// 认证服务类
export class AuthService {
  // 用户登录
  async signIn(credentials: SignInRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.AUTH.SIGNIN,
        credentials
      );
      
      if (response.data) {
        // 存储 token 到本地存储
        // TODO: 使用 AsyncStorage 存储 token
        console.log('Login successful, token:', response.data.token);
        return response.data;
      }
      
      throw new Error('Login failed');
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  // 用户注册
  async signUp(userData: SignUpRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.AUTH.SIGNUP,
        userData
      );
      
      if (response.data) {
        // 存储 token 到本地存储
        // TODO: 使用 AsyncStorage 存储 token
        console.log('Registration successful, token:', response.data.token);
        return response.data;
      }
      
      throw new Error('Registration failed');
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  // 获取当前用户信息
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<User>(API_CONFIG.ENDPOINTS.AUTH.ME);
      return response.data || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // 用户登出
  async signOut(): Promise<void> {
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.SIGNOUT);
      // 清除本地存储的 token
      // TODO: 清除 AsyncStorage 中的 token
      console.log('Sign out successful');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // 检查是否已登录
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null;
    } catch (error) {
      return false;
    }
  }
}

// 创建单例实例
export const authService = new AuthService();
