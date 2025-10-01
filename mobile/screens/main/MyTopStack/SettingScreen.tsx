import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import Header from "../../../components/Header"; // ✅ 你刚刚重构的 Header
import Icon from "../../../components/Icon";

export default function SettingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title="Settings" showBack />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.sectionBox}>
          <SettingItem icon="person-outline" label="Edit profile" />
          <SettingItem icon="shield-outline" label="Security" />
          <SettingItem icon="notifications-outline" label="Notifications" />
          <SettingItem icon="lock-closed-outline" label="Privacy" />
        </View>

        {/* Support Section */}
        <Text style={styles.sectionTitle}>Support & About</Text>
        <View style={styles.sectionBox}>
          <SettingItem icon="card-outline" label="My Premium" />
          <SettingItem icon="help-circle-outline" label="Help & Support" />
          <SettingItem icon="information-circle-outline" label="Terms and Policies" />
        </View>

        {/* Actions Section */}
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.sectionBox}>
          <SettingItem icon="flag-outline" label="Report" />
          <SettingItem icon="log-out-outline" label="Log out" />
        </View>
      </ScrollView>
    </View>
  );
}

// ✅ 单个 Setting Item
import type { IconProps } from "../../../components/Icon"; // Add this import if IconProps is exported

const SettingItem = ({
  icon,
  label,
}: {
  icon: IconProps["name"];
  label: string;
}) => {
  return (
    <TouchableOpacity style={styles.item}>
      <Icon name={icon} size={22} color="#444" style={{ marginRight: 12 }} />
      <Text style={styles.itemText}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    rowGap: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 0.005,
  },
  sectionBox: {
    backgroundColor: "#f5f5f7", // ✅ 浅灰背景
    borderRadius: 12,
    paddingVertical: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  itemText: {
    fontSize: 16,
    color: "#000",
  },
});
