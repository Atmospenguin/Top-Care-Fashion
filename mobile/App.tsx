import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from "@react-navigation/native";
import { Text } from "react-native";

enableScreens();
import { createNativeStackNavigator } from "@react-navigation/native-stack";
// Make sure SplashScreen.tsx exists in ./screens, or update the path if needed
import SplashScreen from "./screens/auth/SplashScreen";
import LandingScreen from "./screens/auth/LandingScreen";
import LoginScreen from "./screens/auth/LoginScreen";
import RegisterScreen from './screens/auth/RegisterScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";




//import HomeScreen from "./screens/main/HomeStack/HomeScreen";
//import DiscoverScreen from "./screens/main/DiscoverStack/DiscoverScreen";
//import SellScreen from "./screens/main/SellStack/SellScreen";
//import InboxScreen from "./screens/main/InboxStack/InboxScreen";
import InboxScreen from './screens/main/InboxStack/InboxScreen';
import SellScreen from './screens/main/SellStack/SellScreen';
import DiscoverScreen from './screens/main/DiscoverStack/DiscoverScreen';
import HomeScreen from './screens/main/HomeStack/HomeScreen';
import Icon from "./components/Icon";
import MyTopStackNavigator from './screens/main/MyTopStack';


export type RootStackParamList = {
  Splash: undefined;
  Landing: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();



function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#999",
        tabBarLabel: ({ focused, color }) => (
          <Text
            style={{
              fontSize: 12,
              color,
              fontWeight: focused ? "700" : "500",
              letterSpacing: -0.25,
            }}
          >
            {route.name}
          </Text>
        ),
        tabBarIcon: ({ focused, color }) => {
          switch (route.name) {
            case "Home":
              return (
                <Icon
                  name={focused ? "home" : "home-outline"}
                  size={22}
                  color={color}
                />
              );
            case "Discover":
              return (
                <Icon
                  name={focused ? "compass" : "compass-outline"}
                  size={22}
                  color={color}
                />
              );
            case "Sell":
              return (
                <Icon
                  name={focused ? "add-circle" : "add-circle-outline"}
                  size={22}
                  color={color}
                />
              );
            case "Inbox":
              return (
                <Icon
                  name={focused ? "chatbubbles" : "chatbubbles-outline"}
                  size={22}
                  color={color}
                />
              );
            case "My TOP":
              return (
                <Icon
                  name={focused ? "person" : "person-outline"}
                  size={22}
                  color={color}
                />
              );
          }
          return null;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Sell" component={SellScreen} />
      <Tab.Screen name="Inbox" component={InboxScreen} />
      <Tab.Screen name="My TOP" component={MyTopStackNavigator} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
