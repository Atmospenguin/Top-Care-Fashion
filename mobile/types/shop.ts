export type ListingCategory = "top" | "bottom" | "shoe" | "accessory";

export type ListingItem = {
  id: string;
  title: string;
  price: number;
  description: string;
  brand: string;
  size: string;
  condition: string;
  material?: string;
  gender?: string;
  tags?: string[]; // 添加用户自定义标签
  images: string[];
  category?: ListingCategory;
  seller: {
    id: number;
    name: string;
    avatar: string;
    rating: number;
    sales: number;
  };
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
