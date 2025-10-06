import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LOGO_WHITE } from "../../constants/assetUrls";

type RootStackParamList = {
  Splash: undefined;
  Landing: undefined;
  Login: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Landing"); // 2 秒后跳转 Landing
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

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
