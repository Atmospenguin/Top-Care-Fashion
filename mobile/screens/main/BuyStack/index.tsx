import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ListingDetailScreen from "./ListingDetailScreen";
import MixMatchScreen from "./MixMatchScreen";
import ViewOutfitScreen from "./ViewOutfitScreen";
import BagScreen from "./BagScreen";
import CheckoutScreen from "./CheckoutScreen";
import PurchaseScreen from "./PurchaseScreen";
import SearchResultScreen from "./SearchResultScreen";
import type { BagItem, ListingItem } from "../../../types/shop";
import HomeScreen from "../HomeStack/HomeScreen";
import UserProfileScreen from "./UserProfileScreen";
import FollowListScreen from "../MyTopStack/FollowListScreen";
  
export type BuyStackParamList = {
  ListingDetail: { item?: ListingItem; listingId?: string; isOwnListing?: boolean }; // ✅ 支持通过 listingId 导航
  MixMatch: { baseItem: ListingItem };
  ViewOutfit: {
    baseItem: ListingItem;
    top: ListingItem | null;
    bottom: ListingItem | null;
    shoe: ListingItem | null;
    accessories: ListingItem[];
    selection: BagItem[];
    outfitName?: string; // ✅ 可选的 outfit name（从 Saved Outfits 传入）
  };
  UserProfile: {
    username?: string;
    userId?: string; // ✅ 支持通过 userId 导航
    avatar?: string;
    rating?: number;
    sales?: number;
  };
  SearchResult: { query: string; gender?: "men" | "women" | "unisex"; category?: string };
  Bag: { items: BagItem[] } | undefined;
  Checkout: { items: BagItem[]; subtotal: number; shipping: number; conversationId?: string };
  Purchase: {
    orderId: string;
    total: number;
    estimatedDelivery: string;
    items: BagItem[];
  };
  HomeMain: undefined;
  FollowList: { type: "followers" | "following"; username: string };
};

const Stack = createNativeStackNavigator<BuyStackParamList>();

export default function BuyStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
      <Stack.Screen name="MixMatch" component={MixMatchScreen} />
      <Stack.Screen name="ViewOutfit" component={ViewOutfitScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="SearchResult" component={SearchResultScreen} />
      <Stack.Screen name="Bag" component={BagScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Purchase" component={PurchaseScreen} />
      <Stack.Screen name="FollowList" component={FollowListScreen} />
    </Stack.Navigator>
  );
}
