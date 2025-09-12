export type UserStatus = "active" | "suspended";

export type UserAccount = {
  id: string;
  username: string;
  email: string;
  status: UserStatus;
  role: "User" | "Admin";
  is_premium: boolean;
  premium_until?: string;
  average_rating?: number; // Average rating as a user (1.00-5.00)
  total_reviews: number; // Total number of reviews received
  createdAt: string; // ISO
};

export type ListingCategory = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
};

export type Listing = {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  sellerId?: string;
  sellerName?: string;
  listed: boolean;
  sold: boolean; // True when listing has been sold
  price: number;
  imageUrl?: string;
  imageUrls?: string[];
  brand?: string;
  size?: string;
  conditionType?: "new" | "like_new" | "good" | "fair" | "poor";
  tags?: string[];
  createdAt: string;
  soldAt?: string; // When the listing was sold
  // Transaction info (if exists)
  txStatus?: "pending" | "paid" | "shipped" | "completed" | "cancelled";
  txId?: string;
};

export type Transaction = {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  quantity: number;
  priceEach: number;
  status: "pending" | "paid" | "shipped" | "completed" | "cancelled";
  createdAt: string;
  
  // Additional info for display
  buyerName?: string;
  sellerName?: string;
  listingName?: string;
};

export type Review = {
  id: string;
  transactionId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number; // 1-5
  comment: string;
  reviewerType: "buyer" | "seller";
  createdAt: string;
  
  // Additional info for display
  reviewerName?: string;
  revieweeName?: string;
  listingName?: string;
  listingId?: string;
};

export type Report = {
  id: string;
  targetType: "listing" | "user";
  targetId: string;
  reporter: string;
  reporterId?: string; // User ID of the reporter
  reason: string;
  status: "open" | "resolved" | "dismissed";
  notes?: string;
  createdAt: string;
  resolvedAt?: string;
};

export type Feedback = {
  id: string;
  userId?: string; // Associated user ID
  userEmail?: string;
  userName?: string; // Display name
  message: string;
  rating?: number; // 1-5 rating
  tags?: string[]; // Tags for categorization
  featured: boolean; // Featured on homepage
  createdAt: string;
};

// Legacy type for backward compatibility
export type Testimonial = {
  id: string;
  user: string;
  text: string;
  rating: number;
  tags: string[];
  featured: boolean;
  ts: number;
};

export type FaqQuery = {
  id: string;
  userId?: string; // Associated user ID
  userEmail?: string; // Contact email
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
