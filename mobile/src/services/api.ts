import { API_CONFIG, ApiResponse, ApiError } from '../config/api';
import { supabase } from '../../constants/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 基础 API 客户端类
class ApiClient {
  private baseURL: string;
  private timeout: number;
  private authToken: string | null = null;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.loadStoredToken();
  }

  // 从 AsyncStorage 加载存储的 token
  private async loadStoredToken(): Promise<void> {
    try {
      const storedToken = await AsyncStorage.getItem('supabase_access_token');
      if (storedToken) {
        this.authToken = storedToken;
        console.log("🔍 API Client - Loaded stored token");
      }
    } catch (error) {
      console.log('🔍 API Client - Failed to load stored token:', error);
    }
  }

  // 设置认证 token
  public setAuthToken(token: string): void {
    this.authToken = token;
    AsyncStorage.setItem('supabase_access_token', token);
    console.log("🔍 API Client - Token set and stored");
  }

  // 清除认证 token
  public clearAuthToken(): void {
    this.authToken = null;
    AsyncStorage.removeItem('supabase_access_token');
    console.log("🔍 API Client - Token cleared");
  }

  // 构建完整 URL
  private buildUrl(endpoint: string): string {
    return `${this.baseURL}${endpoint}`;
  }

  // 获取认证头
  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      // 首先尝试使用存储的 token
      if (this.authToken) {
        console.log("🔍 API Client - Using stored token:", this.authToken.substring(0, 20) + "...");
        return { Authorization: `Bearer ${this.authToken}` };
      }

      // 然后尝试从 Supabase 获取 session
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log("🔍 API Client - Session exists:", !!session);
      console.log("🔍 API Client - Access token exists:", !!session?.access_token);
      
      if (session?.access_token) {
        console.log("🔍 API Client - Got Supabase session, storing token");
        this.setAuthToken(session.access_token);
        return { Authorization: `Bearer ${session.access_token}` };
      }
      
      console.log("🔍 API Client - No valid session found");
    } catch (error) {
      console.log('🔍 API Client - Failed to get auth token:', error);
    }
    
    return {};
  }

  // 基础请求方法
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    
    // 获取认证头
    const authHeaders = await this.getAuthHeaders();
    
    // 构建默认选项
    const defaultOptions: RequestInit = {
      headers: {
        ...authHeaders,
        ...options.headers,
      },
    };

    // 如果不是 FormData，设置 Content-Type
    if (!(options.body instanceof FormData)) {
      defaultOptions.headers = {
        'Content-Type': 'application/json',
        ...defaultOptions.headers,
      };
    }

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData
        );
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // 网络错误或其他错误
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  // GET 请求
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(this.buildUrl(endpoint));
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.request<T>(url.pathname + url.search, {
      method: 'GET',
    });
  }

  // POST 请求
  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const requestOptions: RequestInit = {
      method: 'POST',
    };

    // 如果是 FormData，不设置 Content-Type，让浏览器自动设置
    if (data instanceof FormData) {
      requestOptions.body = data;
    } else if (data) {
      requestOptions.body = JSON.stringify(data);
    }

    return this.request<T>(endpoint, { ...requestOptions, ...options });
  }

  // PUT 请求
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH 请求
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE 请求
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// 创建单例实例
export const apiClient = new ApiClient();


