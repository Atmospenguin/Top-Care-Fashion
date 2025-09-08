export type UserStatus = "active" | "suspended";

export type UserAccount = {
  id: string;
  username: string;
  email: string;
  status: UserStatus;
  role: "User" | "Admin";
  is_premium: boolean;
  premium_until?: string;
  createdAt: string; // ISO
};

export type ProductCategory = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  sellerId?: string;
  listed: boolean;
  price: number;
  imageUrl?: string;
  imageUrls?: string[];
  brand?: string;
  size?: string;
  conditionType?: "new" | "like_new" | "good" | "fair" | "poor";
  tags?: string[];
  createdAt: string;
};

export type Review = {
  id: string;
  productId: string;
  author: string;
  authorUserId?: string;
  rating: number; // 1-5
  comment: string;
  transactionId?: string;
  createdAt: string;
};

export type Report = {
  id: string;
  targetType: "product" | "user";
  targetId: string;
  reporter: string;
  reason: string;
  status: "open" | "resolved" | "dismissed";
  notes?: string;
  createdAt: string;
  resolvedAt?: string;
};

export type Feedback = {
  id: string;
  userEmail?: string;
  message: string;
  createdAt: string;
};

export type FaqQuery = {
  id: string;
  question: string;
  answer?: string;
  createdAt: string;
  answeredAt?: string;
};

export type LandingContent = {
  heroTitle: string;
  heroSubtitle: string;
  updatedAt: string;
};
