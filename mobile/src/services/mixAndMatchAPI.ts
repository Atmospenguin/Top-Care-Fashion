// mobile/src/services/mixAndMatchAPI.ts

import { ClothingItem, UserPreferences, UserInteraction } from '../types/mixAndMatch';

// Replace with your actual API base URL
const API_BASE_URL = 'https://your-api-url.com/api';

/**
 * Fetch all clothing items with optional filters
 */
export const fetchClothingItems = async (filters?: {
  category?: string;
  gender?: 'boy' | 'girl' | 'unisex';
  minPrice?: number;
  maxPrice?: number;
}): Promise<ClothingItem[]> => {
  try {
    const queryParams = new URLSearchParams();
    if (filters?.category) queryParams.append('category', filters.category);
    if (filters?.gender) queryParams.append('gender', filters.gender);
    if (filters?.minPrice) queryParams.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) queryParams.append('maxPrice', filters.maxPrice.toString());

    const response = await fetch(
      `${API_BASE_URL}/items?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers if needed
          // 'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch clothing items');
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching clothing items:', error);
    throw error;
  }
};

/**
 * Fetch user preferences
 */
export const fetchUserPreferences = async (userId: string): Promise<UserPreferences> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/preferences/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user preferences');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    // Return default preferences if API fails
    return {
      userId,
      favoriteColors: [],
      preferredStyles: [],
      priceRange: { min: 0, max: 1000 },
      favoriteBrands: [],
      purchaseHistory: [],
      likedItems: [],
      viewedItems: [],
      dislikedItems: [],
      preferredGender: 'girl',
    };
  }
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/preferences/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferences),
    });

    return response.ok;
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return false;
  }
};

/**
 * Track user interactions for ML learning
 */
export const trackUserInteraction = async (
  interaction: UserInteraction
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(interaction),
    });

    return response.ok;
  } catch (error) {
    console.error('Error tracking user interaction:', error);
    return false;
  }
};

/**
 * Add items to cart
 */
export const addItemsToCart = async (
  userId: string,
  items: ClothingItem[]
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        items: items.map(item => ({
          itemId: item.id,
          quantity: 1,
        })),
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error adding items to cart:', error);
    return false;
  }
};

/**
 * Fetch item details by ID
 */
export const fetchItemDetails = async (itemId: string): Promise<ClothingItem | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch item details');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching item details:', error);
    return null;
  }
};

/**
 * Save outfit combination
 */
export const saveOutfit = async (
  userId: string,
  outfit: {
    topId: string;
    bottomId: string;
    shoesId: string;
    accessoryIds?: string[];
  }
): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/outfits/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        ...outfit,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save outfit');
    }

    const data = await response.json();
    return data.outfitId;
  } catch (error) {
    console.error('Error saving outfit:', error);
    return null;
  }
};

/**
 * Fetch user's saved outfits
 */
export const fetchSavedOutfits = async (userId: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/outfits/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch saved outfits');
    }

    const data = await response.json();
    return data.outfits || [];
  } catch (error) {
    console.error('Error fetching saved outfits:', error);
    return [];
  }
};