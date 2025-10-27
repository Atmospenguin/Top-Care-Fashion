export type ListingCategory = "Accessories" | "Bottoms" | "Footwear" | "Outerwear" | "Tops";

export type ListingItem = {
  id: string;
  title: string;
  price: number;
  description: string;
  brand: string | null;
  size: string | null;
  condition: string | null;
  material?: string | null;
  gender?: string | null;
  tags?: string[]; // 添加用户自定义标签
  images: string[];
  category?: ListingCategory | null;
  shippingOption?: string | null;
  shippingFee?: number | null;
  location?: string | null;
  likesCount?: number;
  createdAt?: string;
  updatedAt?: string;
  seller: {
    id?: number;
    name: string;
    avatar: string;
    rating: number;
    sales: number;
    isPremium?: boolean;
  };
  // 🔥 添加订单相关字段（仅对sold商品）
  orderStatus?: string | null;
  orderId?: number | null;
  conversationId?: string | null;
};

export type BagItem = {
  item: ListingItem;
  quantity: number;
};

export type ShippingAddress = {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type PaymentMethod = {
  label: string;
  last4: string;
  brand: string;
};
