import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MyTopScreen from "./MyTopScreen";
import SettingScreen from "./SettingScreen";
import EditProfileScreen from "./EditProfileScreen";
import OrderDetailScreen from "./OrderDetailScreen";
import SecurityScreen from "./SecurityScreen";
import ActiveListingDetailScreen from "./ActiveListingDetailScreen";
import ManageListingScreen from "./ManageListingScreen";

export type MyTopStackParamList = {
  MyTopMain: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Security: undefined;
  OrderDetail: { id: string; source: "purchase" | "sold" };
  ActiveListingDetail: undefined;
  ManageListing: undefined;
};

const Stack = createNativeStackNavigator<MyTopStackParamList>();

export default function MyTopStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyTopMain" component={MyTopScreen} />
      <Stack.Screen name="Settings" component={SettingScreen} /> 
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        // cast to any because NativeStackNavigationOptions doesn't include tabBarStyle
        options={{ tabBarStyle: { display: "none" } } as any}
      />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="ActiveListingDetail" component={ActiveListingDetailScreen} />
      <Stack.Screen name="ManageListing" component={ManageListingScreen} />
    </Stack.Navigator>
  );
}

