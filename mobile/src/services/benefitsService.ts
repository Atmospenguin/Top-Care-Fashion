import { apiClient } from "./api";

export interface PromotionPricing {
  price: number;
  regularPrice: number;
  discount: number;
  isPremium: boolean;
}

export interface UserBenefitsPayload {
  user: {
    id: number;
    username: string;
    isPremium: boolean;
    premiumUntil: string | null;
  };
  benefits: {
    isPremium: boolean;
    listingLimit: number | null;
    commissionRate: number;
    promotionPrice: number;
    promotionPricing?: PromotionPricing;
    freePromotionLimit: number | null;
    mixMatchLimit: number | null;
    badge: string | null;
    activeListingsCount: number;
    canCreateListing: boolean;
    mixMatchUsedCount: number;
    mixMatchRemaining: number | null;
    canUseMixMatch: boolean;
    freePromotionsUsed: number;
    freePromotionsRemaining: number;
    canUseFreePromotion: boolean;
    freePromotionResetAt: string | null;
  };
}

export class BenefitsService {
  async getUserBenefits(): Promise<UserBenefitsPayload> {
    const res = await apiClient.get<{ success?: boolean; data?: UserBenefitsPayload }>(
      "/api/user/benefits"
    );

    if (res.data?.data) {
      return res.data.data;
    }

    throw new Error("Failed to fetch user benefits");
  }
}

export const benefitsService = new BenefitsService();
export type BenefitsServiceType = BenefitsService;
