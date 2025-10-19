import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { LOGO_FULL_COLOR } from "../../constants/assetUrls";
import Icon from "../../components/Icon";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <View style={styles.container}>
      {/* 返回按钮 */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Icon name="chevron-back" size={20} color="#111" />
      </TouchableOpacity>

      {/* 标题 */}
          <Text style={styles.welcome}>Welcome!</Text>
          <View style={styles.logoWrapper}>
            <LOGO_FULL_COLOR width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />
          </View>

      {/* 输入框 */}
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#9AA0A6"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#9AA0A6"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#9AA0A6"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm password"
        placeholderTextColor="#9AA0A6"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {/* 注册按钮 */}
      <TouchableOpacity
        style={styles.registerBtn}
        onPress={() => {
          navigation.replace("Login");
        }}
      >
        <Text style={styles.registerText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const BRAND_RED = "#F54B3D";
const BRAND_GREEN = "#00BFA6";
const INPUT_BG = "#F6F7F9";

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff", 
    padding: 24,
    justifyContent: "center" // ⬅️ 内容整体垂直居中
  },
  backBtn: {
    position: "absolute",  // ⬅️ 固定在左上角
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
    fontSize: 16,
  },

  registerBtn: {
    height: 56,
    backgroundColor: BRAND_GREEN,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  registerText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});


