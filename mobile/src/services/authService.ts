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
  avatar_url?: string | null;
  phone?: string | null;
  bio?: string | null;
  location?: string | null;
  created_at?: string;
  updated_at?: string;
  preferred_styles?: string[];
  preferred_brands?: string[];
  preferred_size_top?: string | null;
  preferred_size_bottom?: string | null;
  preferred_size_shoe?: string | null;
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
  access_token?: string;
  refresh_token?: string;
}

// 认证服务类
export class AuthService {
  // 用户登录 - 纯 Web API
  async signIn(credentials: SignInRequest): Promise<AuthResponse> {
    try {
      console.log("🔍 Starting Web API sign in...");
      const response = await apiClient.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.AUTH.SIGNIN,
        credentials
      );
      
      if (response.data) {
        console.log('🔍 Web API login successful, user:', response.data.user.username);
        if (response.data.access_token) {
          console.log("🔑 Current JWT Token:", response.data.access_token);
          apiClient.setAuthToken(response.data.access_token);
        }
        return response.data;
      }
      
      throw new Error('Web API login failed');
    } catch (error) {
      console.error('🔍 Error signing in:', error);
      throw error;
    }
  }

  // 用户注册 - 纯 Web API
  async signUp(userData: SignUpRequest): Promise<AuthResponse> {
    try {
      console.log("🔍 Starting Web API sign up...");
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
      // 移动端通过 Bearer token 调用需要鉴权的 /api/profile
      const response = await apiClient.get<{ ok: boolean; user: User }>(API_CONFIG.ENDPOINTS.PROFILE);
      if (response.data && (response.data as any).user) return (response.data as any).user as User;
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // 用户登出 - 纯 Web API
  async signOut(): Promise<void> {
    try {
      console.log("🔍 Starting Web API sign out...");
      await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.SIGNOUT);
      console.log('🔍 Web API sign out successful');
      // Try to clear auth token in a type-safe/runtime-safe way:
      // Prefer calling setAuthToken(undefined) if available on the client implementation,
      // otherwise try to call clearAuthToken at runtime (some implementations may provide it).
      if (typeof (apiClient as any).setAuthToken === 'function') {
        (apiClient as any).setAuthToken(undefined);
      } else if (typeof (apiClient as any).clearAuthToken === 'function') {
        (apiClient as any).clearAuthToken();
      }
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

  // 请求密码重置
  async forgotPassword(email: string): Promise<void> {
    try {
      console.log("🔍 Requesting password reset for:", email);
      await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      console.log('🔍 Password reset email sent successfully');
    } catch (error) {
      console.error('🔍 Error requesting password reset:', error);
      throw error;
    }
  }

  // 重置密码
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      console.log("🔍 Resetting password with token");
      await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, { 
        token, 
        newPassword 
      });
      console.log('🔍 Password reset successful');
    } catch (error) {
      console.error('🔍 Error resetting password:', error);
      throw error;
    }
  }
}

// 创建单例实例
export const authService = new AuthService();


