import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ListingDetailScreen from "./ListingDetailScreen";
import MixMatchScreen from "./MixMatchScreen";
import BagScreen from "./BagScreen";
import CheckoutScreen from "./CheckoutScreen";
import PurchaseScreen from "./PurchaseScreen";
import type { BagItem, ListingItem } from "../../../types/shop";
import HomeScreen from "../HomeStack/HomeScreen";
  
export type BuyStackParamList = {
  ListingDetail: { item: ListingItem };
  MixMatch: { baseItem: ListingItem };
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
      <Stack.Screen name="Bag" component={BagScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Purchase" component={PurchaseScreen} />
    </Stack.Navigator>
  );
}
