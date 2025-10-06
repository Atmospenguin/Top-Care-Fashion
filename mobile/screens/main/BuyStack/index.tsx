import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ListingDetailScreen from "./ListingDetailScreen";
import BagScreen from "./BagScreen";
import CheckoutScreen from "./CheckoutScreen";
import PurchaseScreen from "./PurchaseScreen";
import ReviewScreen from "./ReviewScreen";
import type { BagItem, ListingItem } from "../../../types/shop";

export type BuyStackParamList = {
  ListingDetail: { item: ListingItem };
  Bag: { items: BagItem[] } | undefined;
  Checkout: { items: BagItem[]; subtotal: number; shipping: number };
  Purchase: {
    orderId: string;
    total: number;
    estimatedDelivery: string;
    items: BagItem[];
  };
  Review: { orderId: string; sellerName: string; itemTitle: string };
};

const Stack = createNativeStackNavigator<BuyStackParamList>();

export default function BuyStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
      <Stack.Screen name="Bag" component={BagScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Purchase" component={PurchaseScreen} />
      <Stack.Screen name="Review" component={ReviewScreen} />
    </Stack.Navigator>
  );
}
