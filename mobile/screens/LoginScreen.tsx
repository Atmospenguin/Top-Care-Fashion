import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>
      {/* 返回箭头 */}
      <Text style={styles.backArrow}>←</Text>

      {/* 欢迎文字 */}
      <Text style={styles.welcome}>Welcome!</Text>

      {/* Logo 文字版 */}
      <Text style={styles.logo}>TOP</Text>

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
  welcome: { fontSize: 24, fontWeight: "bold", marginTop: 20, textAlign: "center" },
  logo: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#F54B3D", // 用你的品牌红色
    textAlign: "center",
    marginVertical: 20,
  },
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
