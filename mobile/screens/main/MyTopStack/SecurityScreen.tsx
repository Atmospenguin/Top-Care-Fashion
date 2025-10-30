import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MyTopStackParamList } from "./index";

export default function SecurityScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MyTopStackParamList>>();

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

        {/* Authentication Section */}
        <Text style={styles.sectionTitle}>Login & Authentication</Text>
        <View style={styles.sectionBox}>
          <SettingItem icon="finger-print-outline" label="Two-Factor Authentication" />
          <SettingItem icon="phone-portrait-outline" label="Manage Login Devices" />
        </View>

        {/* Other Section */}
        <Text style={styles.sectionTitle}>Account Safety</Text>
        <View style={styles.sectionBox}>
          <SettingItem icon="shield-checkmark-outline" label="Suspicious Login Alerts" />
          <SettingItem icon="help-circle-outline" label="Report a Security Issue" />
        </View>
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
});
