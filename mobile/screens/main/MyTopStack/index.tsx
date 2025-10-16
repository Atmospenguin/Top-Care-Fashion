import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MyTopScreen from "./MyTopScreen";
import SettingScreen from "./SettingScreen";
import EditProfileScreen from "./EditProfileScreen";
import OrderDetailScreen from "./OrderDetailScreen";
import SecurityScreen from "./SecurityScreen";
import NotificationsScreen from "./NotificationsScreen";
import PrivacyScreen from "./PrivacyScreen";
import HelpSupportScreen from "./HelpSupportScreen";
import TermsPoliciesScreen from "./TermsPoliciesScreen";
import ReportScreen from "./ReportScreen";
import ActiveListingDetailScreen from "./ActiveListingDetailScreen";
import ManageListingScreen from "./ManageListingScreen";
import EditListingScreen from "./EditListingScreen";
import PromotionPlansScreen from "./PromotionPlansScreen";
import MyBoostListingScreen from "./MyBoostListingScreen";
import BoostedListingScreen from "./BoostedListingScreen";
import MyPreferenceScreen from "./MyPreferenceScreen";
import AddSizeScreen from "./AddSizeScreen";
import AddStyleScreen from "./AddStyleScreen";
import EditBrandScreen from "./EditBrandScreen";

export type PreferenceSizes = {
  shoe?: string;
  top?: string;
  bottom?: string;
};

export type MyTopStackParamList = {
  MyTopMain: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Security: undefined;
  Notifications: undefined;
  Privacy: undefined;
  HelpSupport: undefined;
  TermsPolicies: undefined;
  Report: undefined;
  OrderDetail: { id: string; source: "purchase" | "sold" };
  ActiveListingDetail: undefined;
  ManageListing: undefined;
  EditListing: undefined;
  PromotionPlans: undefined;
  MyBoostListings: undefined;
  BoostedListing: undefined;
  MyPreference:
    | {
        selectedStyles?: string[];
        selectedBrands?: string[];
        selectedSizes?: PreferenceSizes;
      }
    | undefined;
  AddSize:
    | {
        selectedSizes?: PreferenceSizes;
      }
    | undefined;
  AddStyle:
    | {
        selectedStyles?: string[];
      }
    | undefined;
  EditBrand:
    | {
        selectedBrands?: string[];
      }
    | undefined;
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
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="TermsPolicies" component={TermsPoliciesScreen} />
      <Stack.Screen name="Report" component={ReportScreen} />
      <Stack.Screen name="ActiveListingDetail" component={ActiveListingDetailScreen} />
      <Stack.Screen name="ManageListing" component={ManageListingScreen} />
      <Stack.Screen name="EditListing" component={EditListingScreen} />
      <Stack.Screen name="PromotionPlans" component={PromotionPlansScreen} />
      <Stack.Screen name="MyBoostListings" component={MyBoostListingScreen} />
      <Stack.Screen name="BoostedListing" component={BoostedListingScreen} />
      <Stack.Screen name="MyPreference" component={MyPreferenceScreen} />
      <Stack.Screen name="AddSize" component={AddSizeScreen} />
      <Stack.Screen name="AddStyle" component={AddStyleScreen} />
      <Stack.Screen name="EditBrand" component={EditBrandScreen} />
    </Stack.Navigator>
  );
}

