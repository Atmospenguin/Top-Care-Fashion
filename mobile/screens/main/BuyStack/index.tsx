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
  
export type BuyStackParamList = {
  ListingDetail: { item: ListingItem; isOwnListing?: boolean };
  MixMatch: { baseItem: ListingItem };
  ViewOutfit: {
    baseItem: ListingItem;
    top: ListingItem | null;
    bottom: ListingItem | null;
    shoe: ListingItem | null;
    accessories: ListingItem[];
    selection: BagItem[];
  };
  UserProfile: {
    username: string;
    avatar: string;
    rating: number;
    sales: number;
  };
  SearchResult: { query: string };
  Bag: { items: BagItem[] } | undefined;
  Checkout: { items: BagItem[]; subtotal: number; shipping: number };
  Purchase: {
    orderId: string;
    total: number;
    estimatedDelivery: string;
    items: BagItem[];
  };
  HomeMain: undefined;
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
    </Stack.Navigator>
  );
}
