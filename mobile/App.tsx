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
    <Tab.Navigator screenOptions={{ headerShown: false }}>
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
