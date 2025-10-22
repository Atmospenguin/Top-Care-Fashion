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

// 创建商品请求参数
export interface CreateListingRequest {
  title: string;
  description: string;
  price: number;
  brand: string;
  size: string;
  condition: string;
  material?: string;
  tags?: string[];
  category: string;
  images: string[];
  shippingOption?: string;
  shippingFee?: number;
  location?: string;
}

// 分类数据结构
export interface CategoryData {
  men: Record<string, string[]>;
  women: Record<string, string[]>;
  unisex: Record<string, string[]>;
}

// 商品服务类
export class ListingsService {
  private async convertImageToBase64(imageUri: string): Promise<string> {
    const response = await fetch(imageUri);
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binaryString = "";
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binaryString += String.fromCharCode(...chunk);
    }
    return globalThis.btoa(binaryString);
  }

  private extractFileName(uri: string): string {
    const segments = uri.split("/").filter(Boolean);
    return segments.length ? segments[segments.length - 1] : `listing-${Date.now()}.jpg`;
  }

  // 获取分类数据
  async getCategories(): Promise<CategoryData> {
    try {
      const response = await apiClient.get<{ data: CategoryData }>('/api/categories');
      
      if (response.data?.data) {
        return response.data.data;
      }
      
      throw new Error('No categories data received');
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // 创建商品
  async createListing(listingData: CreateListingRequest): Promise<ListingItem> {
    try {
      console.log("📝 Creating listing with data:", JSON.stringify(listingData, null, 2));
      console.log("📝 API endpoint:", '/api/listings/create');
      
      const response = await apiClient.post<{ data: ListingItem }>('/api/listings/create', listingData);
      
      console.log("📝 Create listing response:", response);
      
      if (response.data?.data) {
        console.log("✅ Listing created successfully:", response.data.data.id);
        return response.data.data;
      }
      
      throw new Error('No listing data received');
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  }

  async uploadListingImage(imageUri: string): Promise<string> {
    try {
      const imageData = await this.convertImageToBase64(imageUri);
      const fileName = this.extractFileName(imageUri);

      const response = await apiClient.post<{ imageUrl: string }>(
        '/api/listings/upload-image',
        { imageData, fileName }
      );

      if (response.data?.imageUrl) {
        return response.data.imageUrl;
      }

      throw new Error('Image upload failed');
    } catch (error) {
      console.error('Error uploading listing image:', error);
      throw error;
    }
  }

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


