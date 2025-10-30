import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, BackHandler } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { LOGO_FULL_COLOR } from "../../constants/assetUrls";
import { useAuth } from "../../contexts/AuthContext";
import { getCurrentUser } from "../../api";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, error, clearError, user } = useAuth();

  // Disable back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Return true to prevent default back behavior
      return true;
    });

    // Set navigation options to hide back button
    navigation.setOptions({
      headerShown: false,
      gestureEnabled: false,
    });

    return () => backHandler.remove();
  }, [navigation]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      clearError();
      await login(email.trim(), password);
      // 登录成功后，拉取一次用户资料以判定是否已有偏好
      let hasPreference = false;
      try {
        const me = await getCurrentUser();
        const u = (me as any)?.data?.user || null;
        hasPreference = Boolean(
          u && (
            u.gender ||
            (Array.isArray(u.preferred_styles) && u.preferred_styles.length > 0) ||
            u.preferred_size_top || u.preferred_size_bottom || u.preferred_size_shoe
          )
        );
      } catch {}
      navigation.replace(hasPreference ? "Main" : "OnboardingPreference");
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Please check your credentials and try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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

      {/* 错误信息 */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* 登录按钮 */}
      <TouchableOpacity
        style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.loginText}>Login</Text>
        )}
      </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
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
  loginBtnDisabled: { opacity: 0.6 },

  errorText: {
    color: "#F54B3D",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
});

