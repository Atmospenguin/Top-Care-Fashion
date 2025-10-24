import { API_CONFIG, ApiResponse, ApiError } from '../config/api';
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
      const storedToken = await AsyncStorage.getItem('auth_token');
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
    AsyncStorage.setItem('auth_token', token);
    console.log("🔍 API Client - Token set and stored");
  }

  // 清除认证 token
  public clearAuthToken(): void {
    this.authToken = null;
    AsyncStorage.removeItem('auth_token');
    console.log("🔍 API Client - Token cleared");
  }

  // 构建完整 URL
  private buildUrl(endpoint: string): string {
    return `${this.baseURL}${endpoint}`;
  }

  // 获取认证头
  private async getAuthHeaders(): Promise<Record<string, string>> {
    // 仅使用本地存储的 token（来自 Web API 登录返回的 access_token）
    if (this.authToken) {
      return { Authorization: `Bearer ${this.authToken}` };
    }
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      if (storedToken) {
        this.authToken = storedToken;
        return { Authorization: `Bearer ${storedToken}` };
      }
    } catch (e) {
      console.log('🔍 API Client - No auth token available');
    }
    return {};
  }

  // 基础请求方法
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
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
      console.log(`🔍 API Request -> ${options.method || 'GET'} ${url} (timeout: ${this.timeout}ms)`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, { 
        ...defaultOptions, 
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const ct = response.headers.get('content-type') || '';
      console.log(`🔍 API Response <- ${options.method || 'GET'} ${url} status=${response.status} time=${Date.now()}`);
      if (!ct.includes('application/json')) {
        console.log(`🔍 API Response Content-Type: ${ct}`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // 如果是 401 错误且还有重试次数，尝试刷新 session
        if (response.status === 401 && retryCount < 1) {
          console.log(`🔍 API Client - 401 error, attempting session refresh (retry ${retryCount + 1})`);
          
          // 清除当前 token
          this.authToken = null;
          await AsyncStorage.removeItem('auth_token');
          
          // 递归重试
          return this.request<T>(endpoint, options, retryCount + 1);
        }
        
        throw new ApiError(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData
        );
      }

      // 优先按 JSON 解析，若非 JSON，抛出带正文摘要的错误，帮助定位错误服务端/URL
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        return { data };
      } else {
        const text = await response.text();
        const snippet = text.slice(0, 200);
        throw new ApiError(
          `Non-JSON response (Content-Type: ${contentType})`,
          response.status,
          { preview: snippet }
        );
      }
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
  async delete<T>(endpoint: string, options?: { data?: any }): Promise<ApiResponse<T>> {
    const requestOptions: RequestInit = {
      method: 'DELETE',
    };

    // 如果有数据，添加到请求体中
    if (options?.data) {
      requestOptions.body = JSON.stringify(options.data);
    }

    return this.request<T>(endpoint, requestOptions);
  }
}

// 创建单例实例
export const apiClient = new ApiClient();


