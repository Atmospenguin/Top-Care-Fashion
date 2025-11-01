import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MyTopStackParamList } from "./index";
import { apiClient } from "../../../src/services/api";

declare const __DEV__: boolean;

export default function SecurityScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MyTopStackParamList>>();
  const [showDevTools, setShowDevTools] = useState(false);

  const openChangePassword = () => {
    navigation.navigate("ChangePassword");
  };

  const openForgotPassword = () => {
    const tabNavigator = navigation.getParent();
    const rootNavigator = tabNavigator?.getParent?.();
    if (rootNavigator && typeof rootNavigator.navigate === "function") {
      rootNavigator.navigate("ForgotPassword" as never);
    }
  };

  const testAutoLogout = async () => {
    Alert.alert(
      "测试自动登出",
      "这将设置一个无效的 token，下次 API 调用将触发 401 错误，然后尝试刷新 session。由于 token 无效，刷新会失败，系统将自动登出并跳转到登录页。",
      [
        { text: "取消", style: "cancel" },
        {
          text: "确定",
          onPress: async () => {
            await apiClient.setInvalidTokenForTesting();
            Alert.alert(
              "已设置无效 Token",
              "现在返回到个人主页，系统将尝试加载数据并自动登出。",
              [
                {
                  text: "好的",
                  onPress: () => {
                    // 返回到 My TOP 主页，触发数据加载
                    navigation.goBack();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title="Security" showBack />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Password Section */}
        <Text style={styles.sectionTitle}>Password</Text>
        <View style={styles.sectionBox}>
          <SettingItem icon="key-outline" label="Change Password" onPress={openChangePassword} />
          <SettingItem icon="lock-open-outline" label="Forgot Password" onPress={openForgotPassword} />
        </View>

        {/* Developer Tools Section (only in dev mode) */}
        {__DEV__ && (
          <>
            <TouchableOpacity
              onPress={() => setShowDevTools(!showDevTools)}
              style={styles.devToggle}
            >
              <Text style={styles.sectionTitle}>
                Developer Tools {showDevTools ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {showDevTools && (
              <View style={[styles.sectionBox, { backgroundColor: '#fff3cd' }]}>
                <SettingItem
                  icon="bug-outline"
                  label="🧪 Test Auto Logout"
                  onPress={testAutoLogout}
                />
                <View style={styles.devNote}>
                  <Text style={styles.devNoteText}>
                    测试 token 过期后的自动登出和导航功能
                  </Text>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const SettingItem = ({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  onPress?: () => void;
}) => {
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <Icon name={icon} size={22} color="#333" />
        <Text style={styles.itemText}>{label}</Text>
      </View>
      <Icon name="chevron-forward" size={20} color="#aaa" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    marginTop: 20,
    marginBottom: 8,
  },
  sectionBox: {
    backgroundColor: "#f5f5f7",
    borderRadius: 12,
    paddingVertical: 4,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e6e6e6",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
  },
  itemText: {
    fontSize: 16,
    color: "#111",
  },
  devToggle: {
    marginTop: 20,
  },
  devNote: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fffbf0',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f0ad4e',
  },
  devNoteText: {
    fontSize: 13,
    color: '#856404',
    fontStyle: 'italic',
  },
});
