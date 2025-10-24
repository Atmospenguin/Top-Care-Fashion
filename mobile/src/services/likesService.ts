import { API_CONFIG } from '../config/api';

export interface LikedListing {
  id: number;
  listing: {
    id: number;
    name: string;
    price: number;
    size?: string;
    condition_type?: string;
    description?: string;
    image_url?: string;
    image_urls?: string[];
    tags?: string[];
    seller: {
      id: number;
      username: string;
      avatar_url?: string;
      average_rating?: number;
      total_reviews?: number;
    };
    created_at: string;
    updated_at: string;
  };
  created_at: string;
}

export interface LikeStatus {
  liked: boolean;
}

class LikesService {
  private baseUrl = API_CONFIG.BASE_URL;

  // Get user's liked listings
  async getLikedListings(): Promise<LikedListing[]> {
    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.LIKES}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get liked listings');
      }

      return result.data;
    } catch (error) {
      console.error('Error getting liked listings:', error);
      throw error;
    }
  }

  // Like a listing
  async likeListing(listingId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.LIKES}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          listing_id: listingId,
          action: 'like',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to like listing');
      }

      return result.data.liked;
    } catch (error) {
      console.error('Error liking listing:', error);
      throw error;
    }
  }

  // Unlike a listing
  async unlikeListing(listingId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.LIKES}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          listing_id: listingId,
          action: 'unlike',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to unlike listing');
      }

      return result.data.liked;
    } catch (error) {
      console.error('Error unliking listing:', error);
      throw error;
    }
  }

  // Check if user has liked a specific listing
  async getLikeStatus(listingId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.LIKES}/${listingId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get like status');
      }

      return result.data.liked;
    } catch (error) {
      console.error('Error getting like status:', error);
      throw error;
    }
  }

  // Toggle like status (like if not liked, unlike if liked)
  async toggleLike(listingId: number, currentStatus: boolean): Promise<boolean> {
    if (currentStatus) {
      return await this.unlikeListing(listingId);
    } else {
      return await this.likeListing(listingId);
    }
  }
}

export const likesService = new LikesService();

