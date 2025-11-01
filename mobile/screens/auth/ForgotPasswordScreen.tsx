import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { LOGO_FULL_COLOR } from "../../constants/assetUrls";
import Icon from "../../components/Icon";
import { useAuth } from "../../contexts/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "ForgotPassword">;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onSubmit = async () => {
    if (!email.trim() || countdown > 0) return;
    setSubmitting(true);
    setStatus("Sending...");
    try {
      await requestPasswordReset(email.trim());
      setStatus("Password reset email sent. Please check your inbox.");
      setCountdown(60); // Start 60-second cooldown
    } catch (error: any) {
      setStatus(error?.message || "Failed to send reset email");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 返回按钮 */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Icon name="chevron-back" size={20} color="#111" />
      </TouchableOpacity>

      {/* 标题 */}
      <Text style={styles.title}>Forgot Password?</Text>
      <Text style={styles.subtitle}>
        Don’t worry! It occurs. Please enter the email address linked with your account.
      </Text>

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

      {/* Send Code 按钮 */}
      <TouchableOpacity
        style={[styles.sendBtn, (submitting || countdown > 0) && styles.sendBtnDisabled]}
        onPress={onSubmit}
        disabled={submitting || countdown > 0}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.sendBtnText}>
            {countdown > 0 ? `Resend in ${countdown}s` : "Send Email"}
          </Text>
        )}
      </TouchableOpacity>

      {status ? <Text style={styles.status}>{status}</Text> : null}
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

  title: { fontSize: 28, fontWeight: "800", color: "#111827", marginBottom: 12, textAlign: "center" },
  subtitle: { fontSize: 15, color: "#6B7280", marginBottom: 24, lineHeight: 22, textAlign: "center" },
  logoWrapper: {
    alignSelf: "center",
    width: 120,
    height: 80,
    marginBottom: 24,
  },

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
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  status: {
    marginTop: 24,
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14,
  },
});
