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

export type RootStackParamList = {
  Splash: undefined;
  Landing: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
