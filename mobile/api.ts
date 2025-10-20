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
