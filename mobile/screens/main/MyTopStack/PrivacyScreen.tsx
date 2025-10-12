import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import Header from "../../../components/Header";
import Icon from "../../../components/Icon";

export default function PrivacyScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title="Privacy" showBack />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Visibility</Text>
        <SettingItem
          icon="people-outline"
          label="Profile Visibility"
          description="Control who can view your profile."
        />
        <SettingItem
          icon="chatbox-ellipses-outline"
          label="Messaging"
          description="Choose who can send you messages."
        />

        <Text style={styles.sectionTitle}>Data & Activity</Text>
        <SettingItem
          icon="document-text-outline"
          label="Download My Data"
          description="Request a copy of your account data."
        />
        <SettingItem
          icon="trash-outline"
          label="Delete Search History"
          description="Clear recent searches from your account."
        />

        <Text style={styles.sectionTitle}>Permissions</Text>
        <SettingItem
          icon="location-outline"
          label="Location Access"
          description="Manage location permissions for recommendations."
        />
        <SettingItem
          icon="pricetag-outline"
          label="Ad Preferences"
          description="Update how your data is used for advertising."
        />
      </ScrollView>
    </View>
  );
}

function SettingItem({
  icon,
  label,
  description,
  onPress,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  description: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.itemIconWrapper}>
        <Icon name={icon} size={20} color="#FF4D4F" />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemLabel}>{label}</Text>
        <Text style={styles.itemDescription}>{description}</Text>
      </View>
      <Icon name="chevron-forward" size={18} color="#bbb" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    rowGap: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 16,
    columnGap: 16,
  },
  itemIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffecec",
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: {
    flex: 1,
    rowGap: 4,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  itemDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
});
