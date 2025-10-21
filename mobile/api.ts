import { apiClient as newApiClient } from './src/services/api';
import { supabase } from './constants/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// 基础 API 客户端
class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_URL || 'https://top-care-fashion.vercel.app';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      url += `?${searchParams.toString()}`;
    }
    return this.request<T>(url);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

const apiClient = new ApiClient();

// 商品相关 API
export async function fetchListings(params?: {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}) {
  try {
    const response = await apiClient.get<{ data: { items: any[] } }>('/api/listings', params);
    return response.data?.items || [];
  } catch (error) {
    console.error("Error fetching listings:", error);
    return [];
  }
}

export async function fetchListingById(id: string) {
  try {
    const data = await apiClient.get<any>(`/api/listings/${id}`);
    return data;
  } catch (error) {
    console.error("Error fetching listing by ID:", error);
    return null;
  }
}

// 用户认证 API
export async function signIn(email: string, password: string) {
  try {
    console.log("🔍 Starting login process...");
    
    // 方法 1: 先尝试 Web API 登录（兼容现有用户）
    try {
      console.log("🔍 Trying Web API login first...");
      const data = await newApiClient.post<{ user: any; source?: string; fallback?: boolean }>('/api/auth/signin', {
        email,
        password,
      });
      
      if (data.data?.user) {
        console.log('🔍 Web API login successful, user:', data.data.user.username);
        
        // 如果 Web API 登录成功，尝试建立 Supabase session（可选）
        try {
          console.log("🔍 Attempting to establish Supabase session...");
          const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (!supabaseError && supabaseData?.user && supabaseData.session) {
            console.log("🔍 Supabase session established successfully");
            console.log("🔍 Access token:", supabaseData.session.access_token);
            
            // 设置 API 客户端的认证 token
            newApiClient.setAuthToken(supabaseData.session.access_token);
            
            return data;
          } else {
            console.log("🔍 Supabase session failed:", supabaseError?.message);
            console.log("🔍 Continuing with Web API authentication only");
            // 如果 Supabase session 失败，仍然返回 Web API 登录结果
            return data;
          }
        } catch (supabaseError) {
          console.log("🔍 Supabase session failed:", supabaseError);
          console.log("🔍 Continuing with Web API authentication only");
          // 如果 Supabase session 失败，仍然返回 Web API 登录结果
          return data;
        }
      }
    } catch (webApiError) {
      console.log("🔍 Web API login failed:", webApiError);
    }
    
    // 方法 2: 回退到纯 Supabase 认证
    console.log("🔍 Falling back to Supabase-only authentication...");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error("🔍 Supabase sign in error:", error);
      throw new Error(error.message);
    }
    
    if (!data.user || !data.session) {
      throw new Error("No user or session returned from Supabase");
    }
    
    console.log("🔍 Supabase sign in successful, user ID:", data.user.id);
    console.log("🔍 Access token:", data.session.access_token);
    
    // 设置 API 客户端的认证 token
    newApiClient.setAuthToken(data.session.access_token);
    
    // 返回 Supabase 用户数据，格式与 Web API 一致
    return {
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          username: data.user.email?.split('@')[0] || 'User',
          source: 'supabase'
        }
      }
    };
  } catch (error) {
    console.error("🔍 Error signing in:", error);
    throw error;
  }
}

export async function signUp(username: string, email: string, password: string) {
  try {
    console.log("🔍 Starting Supabase sign up...");
    
    // 使用 Supabase 原生认证
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      console.error("🔍 Supabase sign up error:", error);
      throw new Error(error.message);
    }
    
    if (!data.user) {
      throw new Error("No user returned from Supabase");
    }
    
    console.log("🔍 Supabase sign up successful, user ID:", data.user.id);
    
    // 如果有 session，设置认证 token
    if (data.session) {
      console.log("🔍 Access token:", data.session.access_token);
      newApiClient.setAuthToken(data.session.access_token);
    }
    
    // 返回 Supabase 用户数据，格式与 Web API 一致
    return {
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          username: username,
          source: 'supabase'
        },
        requiresConfirmation: !data.session
      }
    };
  } catch (error) {
    console.error("🔍 Error signing up:", error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const data = await newApiClient.get<{ user: any | null }>('/api/auth/me');
    return data;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function signOut() {
  try {
    console.log("🔍 Starting Supabase sign out...");
    
    // 清除 API 客户端的认证 token
    newApiClient.clearAuthToken();
    
    // 使用 Supabase 原生认证
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("🔍 Supabase sign out error:", error);
      throw new Error(error.message);
    }
    
    console.log("🔍 Supabase sign out successful");
    
    // 也调用 Web API 登出
    await newApiClient.post('/api/auth/signout');
    console.log('🔍 Web API sign out successful');
    return true;
  } catch (error) {
    console.error("🔍 Error signing out:", error);
    throw error;
  }
}

export async function forgotPassword(email: string) {
  try {
    const data = await apiClient.post<{ message: string }>('/api/auth/forgot-password', {
      email,
    });
    return data;
  } catch (error) {
    console.error("Error requesting password reset:", error);
    throw error;
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    const data = await apiClient.post<{ message: string }>('/api/auth/reset-password', {
      token,
      newPassword,
    });
    return data;
  } catch (error) {
    console.error("Error resetting password:", error);
    throw error;
  }
}

// 用户资料 API
export async function getUserProfile() {
  try {
    const data = await apiClient.get<any>('/api/profile');
    return data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function updateUserProfile(profileData: any) {
  try {
    const data = await apiClient.post<any>('/api/profile', profileData);
    return data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

// 反馈 API
export async function getFeedbacks() {
  try {
    const data = await apiClient.get<{ feedbacks: any[] }>('/api/feedback');
    return data.feedbacks || [];
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return [];
  }
}

export async function createFeedback(feedbackData: {
  type: 'bug' | 'feature' | 'general';
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}) {
  try {
    const data = await apiClient.post<any>('/api/feedback', feedbackData);
    return data;
  } catch (error) {
    console.error("Error creating feedback:", error);
    throw error;
  }
}

// 购物车 API
export async function getCartItems() {
  try {
    const data = await apiClient.get<{ items: any[] }>('/api/cart');
    return data.items || [];
  } catch (error) {
    console.error("Error fetching cart items:", error);
    return [];
  }
}

export async function addToCart(listingId: string, quantity: number = 1) {
  try {
    const data = await apiClient.post<any>('/api/cart', {
      listingId,
      quantity
    });
    return data;
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
}

export async function updateCartItem(cartItemId: number, quantity: number) {
  try {
    const data = await apiClient.put<any>('/api/cart', {
      cartItemId,
      quantity
    });
    return data;
  } catch (error) {
    console.error("Error updating cart item:", error);
    throw error;
  }
}

export async function removeFromCart(cartItemId: number) {
  try {
    const data = await apiClient.delete<any>(`/api/cart?cartItemId=${cartItemId}`);
    return data;
  } catch (error) {
    console.error("Error removing from cart:", error);
    throw error;
  }
}

// 订单 API
export async function getOrders(type?: 'buy' | 'sell', status?: string) {
  try {
    const params: any = {};
    if (type) params.type = type;
    if (status) params.status = status;
    
    const data = await apiClient.get<{ orders: any[] }>('/api/orders', params);
    return data.orders || [];
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

export async function createOrder(orderData: {
  cartItemIds: number[];
  addressId: number;
  paymentMethodId?: number;
  shippingMethod?: string;
  notes?: string;
}) {
  try {
    const data = await apiClient.post<any>('/api/orders', orderData);
    return data;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

// 地址 API
export async function getAddresses() {
  try {
    const data = await apiClient.get<{ addresses: any[] }>('/api/addresses');
    return data.addresses || [];
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return [];
  }
}

export async function createAddress(addressData: {
  type?: 'home' | 'work' | 'other';
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}) {
  try {
    const data = await apiClient.post<any>('/api/addresses', addressData);
    return data;
  } catch (error) {
    console.error("Error creating address:", error);
    throw error;
  }
}

export async function updateAddress(addressId: number, addressData: any) {
  try {
    const data = await apiClient.put<any>('/api/addresses', {
      addressId,
      ...addressData
    });
    return data;
  } catch (error) {
    console.error("Error updating address:", error);
    throw error;
  }
}

export async function deleteAddress(addressId: number) {
  try {
    const data = await apiClient.delete<any>(`/api/addresses?addressId=${addressId}`);
    return data;
  } catch (error) {
    console.error("Error deleting address:", error);
    throw error;
  }
}

// 支付方式 API
export async function getPaymentMethods() {
  try {
    const data = await apiClient.get<{ paymentMethods: any[] }>('/api/payment-methods');
    return data.paymentMethods || [];
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return [];
  }
}

export async function createPaymentMethod(paymentData: {
  type: 'credit_card' | 'debit_card' | 'paypal' | 'apple_pay' | 'google_pay';
  label: string;
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault?: boolean;
}) {
  try {
    const data = await apiClient.post<any>('/api/payment-methods', paymentData);
    return data;
  } catch (error) {
    console.error("Error creating payment method:", error);
    throw error;
  }
}

export async function updatePaymentMethod(paymentMethodId: number, paymentData: any) {
  try {
    const data = await apiClient.put<any>('/api/payment-methods', {
      paymentMethodId,
      ...paymentData
    });
    return data;
  } catch (error) {
    console.error("Error updating payment method:", error);
    throw error;
  }
}

export async function deletePaymentMethod(paymentMethodId: number) {
  try {
    const data = await apiClient.delete<any>(`/api/payment-methods?paymentMethodId=${paymentMethodId}`);
    return data;
  } catch (error) {
    console.error("Error deleting payment method:", error);
    throw error;
  }
}
