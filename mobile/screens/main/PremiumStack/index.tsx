import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MyPremiumScreen from "../MyTopStack/MyPremiumScreen";
import PromotionPlansScreen from "../MyTopStack/PromotionPlansScreen";
import PremiumPlansScreen from "../MyTopStack/PremiumPlansScreen";

export type PremiumStackParamList = {
  MyPremium: undefined;
  PromotionPlans: undefined;
  PremiumPlans: undefined;
};

const Stack = createNativeStackNavigator<PremiumStackParamList>();

export default function PremiumStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyPremium" component={MyPremiumScreen} />
      <Stack.Screen name="PromotionPlans" component={PromotionPlansScreen} />
      <Stack.Screen name="PremiumPlans" component={PremiumPlansScreen} />
    </Stack.Navigator>
  );
}


