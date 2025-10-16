import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import DiscoverMainScreen from "./DiscoverMainScreen";
import DiscoverCategoryScreen from "./DiscoverCategoryScreen";
import CategoryDetailScreen from "./CategoryDetailScreen";

export type DiscoverStackParamList = {
  DiscoverMain: undefined;
  DiscoverCategory: { gender: "men" | "women" | "unisex" };
  CategoryDetail: { gender: "men" | "women" | "unisex"; mainCategory: string };
};

const Stack = createNativeStackNavigator<DiscoverStackParamList>();

export default function DiscoverStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DiscoverMain" component={DiscoverMainScreen} />
      <Stack.Screen name="DiscoverCategory" component={DiscoverCategoryScreen} />
      <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
    </Stack.Navigator>
  );
}
