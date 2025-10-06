import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import InboxScreen from "./InboxScreen";
import ChatScreen from "./ChatScreen";

export type InboxStackParamList = {
  InboxMain: undefined;
  Chat: { chatId: string; sender: string };
};

const Stack = createNativeStackNavigator<InboxStackParamList>();

export default function InboxStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InboxMain" component={InboxScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}
