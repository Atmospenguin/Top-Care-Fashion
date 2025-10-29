import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LOGO_WHITE } from "../../constants/assetUrls";
import { useAuth } from "../../contexts/AuthContext";

type RootStackParamList = {
  Splash: undefined;
  Landing: undefined;
  Login: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export default function SplashScreen({ navigation }: Props) {
  const { loading, isAuthenticated } = useAuth();

  // 应用启动时根据认证状态决定跳转：
  // - 已登录 -> 直接进入 Main
  // - 未登录 -> 进入 Landing
  useEffect(() => {
    if (loading) return; // 等待 AuthContext 完成初始化

    if (isAuthenticated) {
      navigation.replace("Main");
    } else {
      navigation.replace("Landing");
    }
  }, [loading, isAuthenticated, navigation]);

  return (
    <View style={styles.container}>
  <LOGO_WHITE width={160} height={120} preserveAspectRatio="xMidYMid meet" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F54B3D", // 品牌红
    justifyContent: "center",
    alignItems: "center",
  },
  // LOGO_WHITE is an SVG component; sizing handled via props.
});
