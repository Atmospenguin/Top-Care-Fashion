import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MyTopScreen from "./MyTopScreen";
import SettingScreen from "./SettingScreen";
import EditProfileScreen from "./EditProfileScreen";
import OrderDetailScreen from "./OrderDetailScreen";
import FeedbackScreen from "./FeedbackScreen";
import MyPremiumScreen from "./MyPremiumScreen";
import PromotionPlansScreen from "./PromotionPlansScreen";
import PremiumPlansScreen from "./PremiumPlansScreen";

export type MyTopStackParamList = {
  MyTopMain: undefined;
  EditProfile: undefined;
  Settings: undefined;
  MyPremium: undefined;
  PromotionPlans: undefined;
  PremiumPlans: undefined;
  OrderDetail: { id: string; source: "purchase" | "sold" };
  Feedback: { orderId: string };
};

const Stack = createNativeStackNavigator<MyTopStackParamList>();

export default function MyTopStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyTopMain" component={MyTopScreen} />
      <Stack.Screen name="Settings" component={SettingScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="MyPremium" component={MyPremiumScreen} />
      <Stack.Screen name="PromotionPlans" component={PromotionPlansScreen} />
      <Stack.Screen name="PremiumPlans" component={PremiumPlansScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
    </Stack.Navigator>
  );
}
