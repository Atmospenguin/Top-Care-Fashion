import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import LogoBrandColor from "../assets/logo_BrandColor.svg"; // 直接引入 svg

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>
      {/* 返回箭头 */}
      <Text style={styles.backArrow}>←</Text>

      {/* Logo */}
      <LogoBrandColor width={120} height={60} style={styles.logo} />

      <Text style={styles.welcome}>Welcome!</Text>

      {/* 输入框 */}
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* 忘记密码 */}
      <Text style={styles.forgotPassword}>Forgot Password?</Text>

      {/* 登录按钮 */}
      <TouchableOpacity style={styles.loginBtn}>
        <Text style={styles.loginText}>Login</Text>
      </TouchableOpacity>

      {/* 注册引导 */}
      <Text style={styles.registerText}>
        Don’t have an account? <Text style={styles.registerLink}>Register Now</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  backArrow: { fontSize: 22, marginTop: 20 },
  logo: { marginTop: 40, alignSelf: "center" },
  welcome: { fontSize: 24, fontWeight: "bold", marginVertical: 20, textAlign: "center" },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginVertical: 10,
  },
  forgotPassword: { textAlign: "right", color: "gray", marginVertical: 5 },
  loginBtn: {
    backgroundColor: "#F54B3D",
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  loginText: { color: "#fff", textAlign: "center", fontWeight: "bold", fontSize: 16 },
  registerText: { textAlign: "center", marginTop: 30, fontSize: 14 },
  registerLink: { color: "#00BFA6", fontWeight: "bold" },
});
