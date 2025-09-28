import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from "@react-navigation/native";

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
import MyTopScreen from "./screens/main/MyTopStack/MyTopScreen";
import InboxScreen from './screens/main/InboxStack/InboxScreen';
import SellScreen from './screens/main/SellStack/SellScreen';
import DiscoverScreen from './screens/main/DiscoverStack/DiscoverScreen';
import HomeScreen from './screens/main/HomeStack/HomeScreen';


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



// 引入图标
import HomeIcon from "./assets/icon_home.svg";
import DiscoverIcon from "./assets/icon_discover.svg";
import SellIcon from "./assets/icon_sell.svg";
import InboxIcon from "./assets/icon_inbox.svg";
import MyTopIcon from "./assets/icon_my_top.svg";


function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 12 },
        tabBarIcon: ({ focused }) => {
          switch (route.name) {
            case "Home":
              return <HomeIcon width={22} height={22} fill={focused ? "#000" : "#999"} />;
            case "Discover":
              return <DiscoverIcon width={22} height={22} fill={focused ? "#000" : "#999"} />;
            case "Sell":
              return <SellIcon width={22} height={22} fill={focused ? "#000" : "#999"} />;
            case "Inbox":
              return <InboxIcon width={22} height={22} fill={focused ? "#000" : "#999"} />;
            case "MyTop":
              return <MyTopIcon width={22} height={22} fill={focused ? "#000" : "#999"} />;
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Sell" component={SellScreen} />
      <Tab.Screen name="Inbox" component={InboxScreen} />
      <Tab.Screen name="MyTop" component={MyTopScreen} />
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
