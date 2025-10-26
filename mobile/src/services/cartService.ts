import { API_CONFIG } from '../config/api';

export interface CartItem {
  id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  item: {
    id: string;
    title: string;
    price: number;
    description: string;
    brand: string;
    size: string;
    condition: string;
    material?: string;
    gender?: string;
    tags?: string[];
    category?: string;
    images: string[];
    shippingOption?: string | null;
    shippingFee?: number | null;
    location?: string | null;
    seller: {
      id: number;
      name: string;
      avatar: string;
      rating: number;
      sales: number;
    };
  };
}

export interface CartResponse {
  items: CartItem[];
}

export interface AddToCartRequest {
  listingId: string;
  quantity?: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

class CartService {
  private baseUrl = API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.CART;

  async getCartItems(): Promise<CartItem[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...API_CONFIG.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: CartResponse = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching cart items:', error);
      throw error;
    }
  }

  async addToCart(listingId: string, quantity: number = 1): Promise<CartItem> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...API_CONFIG.getAuthHeaders(),
        },
        body: JSON.stringify({
          listingId,
          quantity,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }

      const data: CartItem = await response.json();
      return data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  async updateCartItem(cartItemId: number, quantity: number): Promise<CartItem> {
    try {
      const response = await fetch(`${this.baseUrl}/${cartItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...API_CONFIG.getAuthHeaders(),
        },
        body: JSON.stringify({
          quantity,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }

      const data: CartItem = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  }

  async removeCartItem(cartItemId: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${cartItemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...API_CONFIG.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error removing cart item:', error);
      throw error;
    }
  }

  async clearCart(): Promise<void> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...API_CONFIG.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }
}

export const cartService = new CartService();
