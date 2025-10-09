import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Switch } from "react-native";
import Header from "../../../components/Header";

export default function NotificationsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title="Notifications" showBack />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>General</Text>
        <SettingToggle
          label="Push Notifications"
          value={pushEnabled}
          onValueChange={setPushEnabled}
        />
        <SettingToggle
          label="Email Updates"
          value={emailEnabled}
          onValueChange={setEmailEnabled}
        />

        <Text style={styles.sectionTitle}>Marketing Preferences</Text>
        <SettingToggle
          label="Marketing SMS"
          value={smsEnabled}
          onValueChange={setSmsEnabled}
        />
        <SettingToggle
          label="Personalized Offers"
          value={marketingEnabled}
          onValueChange={setMarketingEnabled}
        />

        <Text style={styles.note}>
          Update how you'd like to hear from us. Changes are saved automatically.
        </Text>
      </ScrollView>
    </View>
  );
}

function SettingToggle({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
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
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e6e6e6",
  },
  toggleLabel: {
    fontSize: 16,
    color: "#111",
    flex: 1,
    marginRight: 12,
  },
  note: {
    fontSize: 13,
    lineHeight: 20,
    color: "#666",
  },
});
