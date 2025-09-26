import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type RootStackParamList = {
  Splash: undefined;
  Landing: undefined;
  Login: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "Landing">;

export default function LandingScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <Text style={styles.logo}>TOP</Text>

      {/* 标语 */}
      <Text style={styles.tagline}>
        Circular Fashion, Infinite Possibilities
      </Text>
      <Text style={styles.tagline}>
        Circular Wardrobe, Smarter Style
      </Text>

      {/* 按钮 */}
      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.btnText}>Get started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logo: {
    fontSize: 72,
    fontWeight: "900",
    color: "#F54B3D", // 品牌红
    marginBottom: 24,
  },
  tagline: {
    fontSize: 16,
    color: "#111",
    textAlign: "center",
    marginBottom: 6,
  },
  btn: {
    marginTop: 40,
    backgroundColor: "#000",
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  btnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
});
