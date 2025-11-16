// web/src/types/listing.ts

export type ConditionType = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";

export type Gender = "Men" | "Women" | "Unisex";

export type ListingCategory =
  | "Accessories"
  | "Bottoms"
  | "Footwear"
  | "Outerwear"
  | "Tops";

export type ShippingOption = "Standard" | "Express" | "Meet-up";

// API 接收的字符串形式的 condition（会被后端映射到枚举）
export type ConditionString =
  | "Brand New"
  | "New"
  | "Like New"
  | "Like new"
  | "like new"
  | "Good"
  | "good"
  | "Fair"
  | "fair"
  | "Poor"
  | "poor";

// API 接收的字符串形式的 gender（会被后端映射到枚举）
export type GenderString =
  | "Men"
  | "Women"
  | "Unisex"
  | "men"
  | "male"
  | "women"
  | "female"
  | "unisex"
  | "uni"
  | "all";

/**
 * 创建 Listing 请求体（POST /api/listings/create）
 * 对应你文档里的 CreateListingRequest
 */
export interface CreateListingRequest {
  // ===== 必需字段 =====
  title: string; // 1-120 chars
  description: string;
  price: number;
  category: ListingCategory;
  shippingOption: ShippingOption;

  // ===== 可选字段 =====
  brand?: string | null;
  size?: string | null;
  condition?: ConditionString; // 默认 "Good"
  material?: string | null;
  tags?: string[];
  gender?: GenderString; // 默认 "Unisex"
  images?: string[];
  shippingFee?: number | null;
  location?: string | null;
  quantity?: number; // 默认 1，≥1
  listed?: boolean; // 默认 true
  sold?: boolean; // 默认 false
}

/**
 * 后端返回的 Listing 对象（简化版，可按需要扩展）
 * 对应 API 成功响应里的 data 部分
 */
export interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  brand: string | null;
  size: string | null;
  condition: ConditionType; // 存储的是枚举
  material: string | null;
  tags: string[];
  category: ListingCategory;
  images: string[];
  shippingOption: ShippingOption;
  shippingFee: number | null;
  location: string | null;
  gender: Gender;
  quantity: number;
  listed: boolean;
  sold: boolean;

  // 只读字段（系统生成）
  createdAt: string; // ISO string
  updatedAt: string;
  likesCount?: number;
  viewsCount?: number;
  clicksCount?: number;

  seller?: {
    name: string;
    avatar?: string | null;
    rating?: number | null;
    sales?: number | null;
  };
}


