import { apiClient } from './api';
import { API_CONFIG } from '../config/api';
import { supabase } from '../../constants/supabase';

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
  avatar_url?: string | null;
  phone?: string | null;
  bio?: string | null;
  location?: string | null;
  created_at?: string;
  updated_at?: string;
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
  // 用户登录 - 使用 Supabase 原生认证
  async signIn(credentials: SignInRequest): Promise<AuthResponse> {
    try {
      console.log("🔍 Starting Supabase sign in...");
      
      // 使用 Supabase 原生认证
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      
      if (error) {
        console.error("🔍 Supabase sign in error:", error);
        throw new Error(error.message);
      }
      
      if (!data.user) {
        throw new Error("No user returned from Supabase");
      }
      
      console.log("🔍 Supabase sign in successful, user ID:", data.user.id);
      
      // 通过 Web API 获取用户详细信息
      const response = await apiClient.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.AUTH.SIGNIN,
        credentials
      );
      
      if (response.data) {
        console.log('🔍 Web API login successful, user:', response.data.user.username);
        return response.data;
      }
      
      throw new Error('Web API login failed');
    } catch (error) {
      console.error('🔍 Error signing in:', error);
      throw error;
    }
  }

  // 用户注册 - 使用 Supabase 原生认证
  async signUp(userData: SignUpRequest): Promise<AuthResponse> {
    try {
      console.log("🔍 Starting Supabase sign up...");
      
      // 使用 Supabase 原生认证
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });
      
      if (error) {
        console.error("🔍 Supabase sign up error:", error);
        throw new Error(error.message);
      }
      
      if (!data.user) {
        throw new Error("No user returned from Supabase");
      }
      
      console.log("🔍 Supabase sign up successful, user ID:", data.user.id);
      
      // 通过 Web API 获取用户详细信息
      const response = await apiClient.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.AUTH.SIGNUP,
        userData
      );
      
      if (response.data) {
        console.log('🔍 Web API registration successful, user:', response.data.user.username);
        return response.data;
      }
      
      throw new Error('Web API registration failed');
    } catch (error) {
      console.error('🔍 Error signing up:', error);
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

  // 用户登出 - 使用 Supabase 原生认证
  async signOut(): Promise<void> {
    try {
      console.log("🔍 Starting Supabase sign out...");
      
      // 使用 Supabase 原生认证
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("🔍 Supabase sign out error:", error);
        throw new Error(error.message);
      }
      
      console.log("🔍 Supabase sign out successful");
      
      // 也调用 Web API 登出
      await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.SIGNOUT);
      console.log('🔍 Web API sign out successful');
    } catch (error) {
      console.error('🔍 Error signing out:', error);
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


