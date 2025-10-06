import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { LOGO_FULL_COLOR } from "../../constants/assetUrls";
import Icon from "../../components/Icon";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>
      {/* 返回按钮 */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Icon name="chevron-back" size={20} color="#111" />
      </TouchableOpacity>

      {/* 欢迎文字 */}
      <Text style={styles.welcome}>Welcome!</Text>
      <View style={styles.logoWrapper}>
        <LOGO_FULL_COLOR width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />
      </View>

      {/* 输入框 */}
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#9AA0A6"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <View style={styles.passwordWrap}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Enter your password"
          placeholderTextColor="#9AA0A6"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        
      </View>

      {/* 忘记密码 */}
      <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
      <Text style={styles.forgot}>Forgot Password?</Text>
      </TouchableOpacity>

      {/* 登录按钮 */}
      <TouchableOpacity
        style={styles.loginBtn}
        onPress={() => navigation.replace("Main")}
      >
        <Text style={styles.loginText}>Login</Text>
      </TouchableOpacity>

      {/* 注册引导 */}
      <Text style={styles.registerText}>
        Don’t have an account?{" "}
        <Text style={styles.registerLink} onPress={() => navigation.navigate("Register")}>
          Register Now
        </Text>
      </Text>
    </View>
  );
}

const BRAND_RED = "#F54B3D";
const INPUT_BG = "#F6F7F9";

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff", 
    padding: 24, 
    justifyContent: "center" // 让内容垂直居中
  },

  backBtn: {
    position: "absolute",   // 固定在左上角，不会挤压布局
    top: 50, 
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  welcome: { fontSize: 28, fontWeight: "800", color: "#111827", marginBottom: 8 },
  logoWrapper: {
    width: 140,
    height: 100,
    marginBottom: 32,
  },

  input: {
    height: 56,
    borderRadius: 16,
    backgroundColor: INPUT_BG,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EEF0F3",
  },

  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: 16,
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: "#EEF0F3",
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  passwordInput: { flex: 1, fontSize: 16 },

  forgot: {
    alignSelf: "flex-end",
    color: "#6B7280",
    fontWeight: "600",
    marginVertical: 12,
    fontSize: 14,
  },

  loginBtn: {
    height: 56,
    backgroundColor: BRAND_RED,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
   
  },
  loginText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  registerText: { textAlign: "center", marginTop: 24, fontSize: 15, color: "#1F2937" },
  registerLink: { color: "#00BFA6", fontWeight: "700" },
});

