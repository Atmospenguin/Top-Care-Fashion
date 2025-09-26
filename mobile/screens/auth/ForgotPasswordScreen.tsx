import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "ForgotPassword">;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");

  return (
    <View style={styles.container}>
      {/* 返回按钮 */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      {/* 标题 */}
      <Text style={styles.title}>Forgot Password?</Text>
      <Text style={styles.subtitle}>
        Don’t worry! It occurs. Please enter the email address linked with your account.
      </Text>

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

      {/* Send Code 按钮 */}
      <TouchableOpacity style={styles.sendBtn}>
        <Text style={styles.sendBtnText}>Send Code</Text>
      </TouchableOpacity>
    </View>
  );
}

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
  backIcon: { fontSize: 20, color: "#111" },

  title: { fontSize: 28, fontWeight: "800", color: "#111827", marginBottom: 12, textAlign: "center" },
  subtitle: { fontSize: 15, color: "#6B7280", marginBottom: 24, lineHeight: 22, textAlign: "center" },

  input: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#F6F7F9",
    paddingHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#EEF0F3",
  },

  sendBtn: {
    height: 56,
    backgroundColor: "#111827", 
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});

