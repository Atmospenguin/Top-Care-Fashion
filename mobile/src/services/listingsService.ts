import { apiClient } from './api';
import { API_CONFIG } from '../config/api';
import type { ListingCategory, ListingItem } from '../../types/shop';

export interface BrandSummary {
  name: string;
  listingsCount: number;
}

// 用户listings查询参数
export interface UserListingsQueryParams {
  status?: 'active' | 'sold' | 'all';
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'latest' | 'price_low_to_high' | 'price_high_to_low';
  limit?: number;
  offset?: number;
}

export interface ListingsQueryParams {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
  gender?: string;
}

export interface BoostedListingSummary {
  id: number;
  listingId: number;
  title: string;
  size: string | null;
  price: number;
  images: string[];
  primaryImage: string | null;
  status: string;
  startedAt: string | null;
  endsAt: string | null;
  views: number;
  clicks: number;
  viewUpliftPercent: number;
  clickUpliftPercent: number;
  usedFreeCredit: boolean;
}

export interface BoostListingsResponse {
  createdCount: number;
  promotionIds: number[];
  freeCreditsUsed: number;
  paidBoostCount: number;
  totalCharge: number;
  pricePerBoost: number;
  currency: string;
  alreadyPromotedIds?: number[];
}

// 创建商品请求参数
export interface CreateListingRequest {
  title: string;
  description: string;
  price: number;
  brand: string;
  size: string | null;
  condition: string;
  material?: string;
  tags?: string[];
  category: string;
  gender: string;
  images: string[];
  shippingOption?: string;
  shippingFee?: number;
  location?: string;
  listed?: boolean;
  sold?: boolean;
}

// 分类数据结构
export interface CategoryData {
  men: Record<string, string[]>;
  women: Record<string, string[]>;
  unisex: Record<string, string[]>;
}

const VALID_LISTING_CATEGORIES: ListingCategory[] = [
  "Accessories",
  "Bottoms",
  "Footwear",
  "Outerwear",
  "Tops",
];

const PLACEHOLDER_STRING_TOKENS = new Set([
  "",
  "n",
  "na",
  "notavailable",
  "notapplicable",
  "none",
  "null",
  "undefined",
]);

const normalizeToken = (value: string) =>
  value.replace(/[^a-z0-9]/gi, "").toLowerCase();

const sanitizeStringValue = (value?: string | null): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = normalizeToken(trimmed);
  if (PLACEHOLDER_STRING_TOKENS.has(normalized)) {
    return null;
  }

  return trimmed;
};

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

  private sanitizeListingItem(listing: ListingItem): ListingItem {
    const sanitized: ListingItem = {
      ...listing,
      brand: sanitizeStringValue(listing.brand),
      size: sanitizeStringValue(listing.size),
      condition: sanitizeStringValue(listing.condition),
      material: sanitizeStringValue(listing.material),
      gender: sanitizeStringValue(listing.gender),
      shippingOption: sanitizeStringValue(listing.shippingOption),
      location: sanitizeStringValue(listing.location),
      description:
        typeof listing.description === "string"
          ? listing.description.trim()
          : listing.description,
    };

    if (Array.isArray(listing.tags)) {
      const cleanedTags = listing.tags
        .map((tag) => sanitizeStringValue(tag))
        .filter((tag): tag is string => Boolean(tag));
      sanitized.tags = cleanedTags;
    }

    const cleanedCategory = sanitizeStringValue(
      (listing.category as string | null) ?? null
    );
    if (cleanedCategory === null && listing.category !== undefined) {
      sanitized.category = null;
    } else if (
      cleanedCategory &&
      cleanedCategory !== listing.category &&
      VALID_LISTING_CATEGORIES.includes(cleanedCategory as ListingCategory)
    ) {
      sanitized.category = cleanedCategory as ListingCategory;
    }

    return sanitized;
  }

  async getBrandSummaries(params?: { limit?: number; search?: string }): Promise<BrandSummary[]> {
    try {
      const response = await apiClient.get<{
        success?: boolean;
        brands?: BrandSummary[];
        data?: BrandSummary[];
      }>('/api/listings/brands', params);

      const payload = response.data;
      if (!payload) {
        throw new Error('No brand data received');
      }

      if (payload.brands && Array.isArray(payload.brands)) {
        return payload.brands;
      }

      if (payload.data && Array.isArray(payload.data)) {
        return payload.data;
      }

      throw new Error('No brand data received');
    } catch (error) {
      console.error('Error fetching brand summaries:', error);
      throw error;
    }
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
      
      const payload: CreateListingRequest = {
        ...listingData,
        size: sanitizeStringValue(listingData.size),
      };
      
      const response = await apiClient.post<{ data: ListingItem }>('/api/listings/create', payload);
      
      console.log("📝 Create listing response:", response);
      
      if (response.data?.data) {
        console.log("✅ Listing created successfully:", response.data.data.id);
        return this.sanitizeListingItem(response.data.data);
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
      const response = await apiClient.get<{ success: boolean; data: { items: ListingItem[] } }>(
        API_CONFIG.ENDPOINTS.LISTINGS,
        params
      );
      
      if (response.data?.success && response.data.data?.items) {
        return response.data.data.items.map((item) =>
          this.sanitizeListingItem(item)
        );
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
      console.log("📖 Fetching listing by ID:", id);
      
      const response = await apiClient.get<{ listing: ListingItem }>(
        `${API_CONFIG.ENDPOINTS.LISTINGS}/${id}`
      );
      
      console.log("📖 Listing response:", response);
      
      if (response.data?.listing) {
        console.log("✅ Listing found:", response.data.listing.title);
        return this.sanitizeListingItem(response.data.listing);
      }
      
      console.log("❌ No listing data received");
      return null;
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

  async getBoostedListings(): Promise<BoostedListingSummary[]> {
    try {
      const response = await apiClient.get<{ success?: boolean; data?: BoostedListingSummary[] }>(
        '/api/listings/boosted'
      );

      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data.map((item) => ({
          id: item.id,
          listingId: item.listingId,
          title: item.title,
          size: item.size ?? null,
          price: typeof item.price === 'number' ? item.price : Number(item.price) || 0,
          images: Array.isArray(item.images) ? item.images : [],
          primaryImage: item.primaryImage ?? null,
          status: item.status,
          startedAt: item.startedAt ?? null,
          endsAt: item.endsAt ?? null,
          views: typeof item.views === 'number' ? item.views : 0,
          clicks: typeof item.clicks === 'number' ? item.clicks : 0,
          viewUpliftPercent:
            typeof item.viewUpliftPercent === 'number' ? item.viewUpliftPercent : 0,
          clickUpliftPercent:
            typeof item.clickUpliftPercent === 'number' ? item.clickUpliftPercent : 0,
          usedFreeCredit: Boolean(item.usedFreeCredit),
        }));
      }

      return [];
    } catch (error) {
      console.error('Error fetching boosted listings:', error);
      throw error;
    }
  }

  async boostListings(params: {
    listingIds: string[];
    plan: "free" | "premium";
    paymentMethodId?: number | null;
    useFreeCredits?: boolean;
  }): Promise<BoostListingsResponse> {
    try {
      const payloadIds = params.listingIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0);

      if (payloadIds.length === 0) {
        throw new Error("No valid listing IDs provided for boosting");
      }

      const response = await apiClient.post<{
        success?: boolean;
        data?: BoostListingsResponse;
        error?: string;
      }>("/api/listings/boost", {
        listingIds: payloadIds,
        plan: params.plan,
        paymentMethodId: params.paymentMethodId ?? undefined,
        useFreeCredits:
          typeof params.useFreeCredits === "boolean"
            ? params.useFreeCredits
            : true,
      });

      if (response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || "Failed to boost listings");
    } catch (error) {
      console.error("Error creating listing boosts:", error);
      throw error;
    }
  }

  // 获取用户listings中实际使用的分类
  async getUserCategories(): Promise<{ id: number; name: string; description: string; count: number }[]> {
    try {
      console.log("📖 Fetching user categories");
      
      const response = await apiClient.get<{ success: boolean; categories: { id: number; name: string; description: string; count: number }[] }>(
        '/api/listings/my/categories'
      );
      
      console.log("📖 User categories response:", response);
      
      if (response.data?.success && response.data.categories) {
        console.log(`✅ Found ${response.data.categories.length} user categories`);
        return response.data.categories;
      }
      
      throw new Error('No categories data received');
    } catch (error) {
      console.error('Error fetching user categories:', error);
      throw error;
    }
  }

  // 获取用户自己的listings
  async getUserListings(params?: UserListingsQueryParams): Promise<ListingItem[]> {
    try {
      console.log("📖 Fetching user listings with params:", params);
      
      // 构建查询参数，过滤掉undefined值
      const queryParams: any = {};
      if (params?.status) queryParams.status = params.status;
      if (params?.category) queryParams.category = params.category;
      if (params?.condition) queryParams.condition = params.condition;
      if (params?.minPrice !== undefined) queryParams.minPrice = params.minPrice;
      if (params?.maxPrice !== undefined) queryParams.maxPrice = params.maxPrice;
      if (params?.sortBy) queryParams.sortBy = params.sortBy;
      if (params?.limit) queryParams.limit = params.limit;
      if (params?.offset) queryParams.offset = params.offset;
      
      const response = await apiClient.get<{ listings: ListingItem[] }>(
        '/api/listings/my',
        queryParams
      );
      
      console.log("📖 User listings response:", response);
      
      if (response.data?.listings) {
        console.log(`✅ Found ${response.data.listings.length} user listings`);
        return response.data.listings.map((item) =>
          this.sanitizeListingItem(item)
        );
      }
      
      throw new Error('No listings data received');
    } catch (error) {
      console.error('Error fetching user listings:', error);
      throw error;
    }
  }

  // 更新listing
  async updateListing(id: string, updateData: Partial<CreateListingRequest>): Promise<ListingItem> {
    try {
      console.log("📝 Updating listing:", id, "with data:", JSON.stringify(updateData, null, 2));
      
      const payload: Partial<CreateListingRequest> = {
        ...updateData,
      };

      if (Object.prototype.hasOwnProperty.call(updateData, "size")) {
        payload.size = sanitizeStringValue(updateData.size ?? null);
      }
      
      const response = await apiClient.patch<{ listing: ListingItem }>(
        `/api/listings/${id}`,
        payload
      );
      
      console.log("📝 Update listing response:", response);
      
      if (response.data?.listing) {
        console.log("✅ Listing updated successfully:", response.data.listing.id);
        return this.sanitizeListingItem(response.data.listing);
      }
      
      throw new Error('No updated listing data received');
    } catch (error) {
      console.error('Error updating listing:', error);
      throw error;
    }
  }

  // 删除listing
  async deleteListing(id: string): Promise<void> {
    try {
      console.log("🗑️ Deleting listing:", id);
      
      const response = await apiClient.delete<{ success: boolean }>(
        `/api/listings/${id}`
      );
      
      console.log("🗑️ Delete listing response:", response);
      
      if (response.data?.success) {
        console.log("✅ Listing deleted successfully:", id);
        return;
      }
      
      throw new Error('Failed to delete listing');
    } catch (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }
  }
}

// 创建单例实例
export const listingsService = new ListingsService();


