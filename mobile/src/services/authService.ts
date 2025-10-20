import { apiClient } from './api';
import { API_CONFIG } from '../config/api';

// 用户类型 (匹配 Web API 响应)
export interface User {
  id: number;
  username: string;
  email: string;
  role: "User" | "Admin";
  status: "active" | "suspended";
  isPremium: boolean;
  premiumUntil?: string | null;
  dob?: string | null;
  gender?: "Male" | "Female" | null;
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

// 认证响应 (匹配 Web API 响应)
export interface AuthResponse {
  user: User;
  source?: string; // "supabase" | "legacy-cookie"
  fallback?: boolean;
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
        console.log('Login successful, user:', response.data.user.username);
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
        console.log('Registration successful, user:', response.data.user.username);
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
      const response = await apiClient.get<{ user: User | null }>(API_CONFIG.ENDPOINTS.AUTH.ME);
      return response.data?.user || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // 用户登出
  async signOut(): Promise<void> {
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.SIGNOUT);
      // TODO: 清除本地存储的用户信息
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


