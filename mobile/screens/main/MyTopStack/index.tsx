import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MyTopScreen from "./MyTopScreen";
import SettingScreen from "./SettingScreen";
import EditProfileScreen from "./EditProfileScreen";

export type MyTopStackParamList = {
  MyTopMain: undefined;
  EditProfile: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<MyTopStackParamList>();

export default function MyTopStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyTopMain" component={MyTopScreen} />
      <Stack.Screen name="Settings" component={SettingScreen} /> 
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}

