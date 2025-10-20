import { apiClient } from './api';
import { API_CONFIG } from '../config/api';
import type { ListingItem } from '../types/shop';

// 商品列表查询参数
export interface ListingsQueryParams {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

// 商品服务类
export class ListingsService {
  // 获取商品列表
  async getListings(params?: ListingsQueryParams): Promise<ListingItem[]> {
    try {
      const response = await apiClient.get<{ items: ListingItem[] }>(
        API_CONFIG.ENDPOINTS.LISTINGS,
        params
      );
      
      if (response.data?.items) {
        return response.data.items;
      }
      
      throw new Error('No listings data received');
    } catch (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }
  }

  // 根据 ID 获取单个商品
  async getListingById(id: string): Promise<ListingItem | null> {
    try {
      const response = await apiClient.get<ListingItem>(
        `${API_CONFIG.ENDPOINTS.LISTINGS}/${id}`
      );
      
      return response.data || null;
    } catch (error) {
      console.error('Error fetching listing by ID:', error);
      throw error;
    }
  }

  // 搜索商品
  async searchListings(query: string, params?: Omit<ListingsQueryParams, 'search'>): Promise<ListingItem[]> {
    return this.getListings({ ...params, search: query });
  }

  // 按分类获取商品
  async getListingsByCategory(category: string, params?: Omit<ListingsQueryParams, 'category'>): Promise<ListingItem[]> {
    return this.getListings({ ...params, category });
  }

  // 按价格范围获取商品
  async getListingsByPriceRange(minPrice: number, maxPrice: number, params?: Omit<ListingsQueryParams, 'minPrice' | 'maxPrice'>): Promise<ListingItem[]> {
    return this.getListings({ ...params, minPrice, maxPrice });
  }
}

// 创建单例实例
export const listingsService = new ListingsService();


