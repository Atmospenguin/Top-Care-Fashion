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
    const data = await apiClient.get<{ items: any[] }>('/api/listings', params);
    return data.items || [];
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
    const data = await apiClient.post<{ user: any; source?: string; fallback?: boolean }>('/api/auth/signin', {
      email,
      password,
    });
    return data;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
}

export async function signUp(username: string, email: string, password: string) {
  try {
    const data = await apiClient.post<{ user: any; requiresConfirmation?: boolean }>('/api/auth/register', {
      username,
      email,
      password,
    });
    return data;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const data = await apiClient.get<{ user: any | null }>('/api/auth/me');
    return data;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function signOut() {
  try {
    await apiClient.post('/api/auth/signout');
    return true;
  } catch (error) {
    console.error("Error signing out:", error);
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
