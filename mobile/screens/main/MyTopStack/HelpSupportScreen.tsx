import React, { useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import type { MyTopStackParamList } from "./index";
import { API_BASE_URL } from "../../../src/config/api";

const helpTopics = [
  {
    icon: "help-circle-outline" as const,
    title: "Frequently Asked Questions",
    description: "Browse common questions and answers from our community.",
    action: "faq" as const,
  },
  {
    icon: "help-circle-outline" as const,
    title: "Getting Started",
    description: "Learn how to set up your shop and list items quickly.",
  },
  {
    icon: "shirt-outline" as const,
    title: "Buying & Selling",
    description: "Tips for buying safely and managing your listings.",
  },
  {
    icon: "wallet-outline" as const,
    title: "Payments",
    description: "Manage payouts, refunds, and payment methods.",
  },
  {
    icon: "sync-outline" as const,
    title: "Returns & Disputes",
    description: "Steps to resolve order issues with other users.",
  },
];

type HelpSupportNavigation = NativeStackNavigationProp<MyTopStackParamList>;

export default function HelpSupportScreen() {
  const navigation = useNavigation<HelpSupportNavigation>();

  const handleChatNow = useCallback(() => {
    const chatParams = {
      sender: "TOP Support",
      kind: "support" as const,
      conversationId: "support-1",
    };

    // Navigate via the root stack so the user returns to HelpSupport when backing out of chat
    let rootNavigation: any = navigation;
    while (rootNavigation?.getParent?.()) {
      rootNavigation = rootNavigation.getParent();
    }

    if (rootNavigation?.navigate) {
      rootNavigation.navigate("ChatStandalone", chatParams);
      return;
    }

    Alert.alert("Navigation unavailable", "Please open the Inbox tab to chat with support.");
  }, [navigation]);

  const handleTopicPress = useCallback((topic: typeof helpTopics[0]) => {
    if (topic.action === "faq") {
      // Extract base URL from API_BASE_URL and open FAQ page
      const baseUrl = API_BASE_URL.replace(/\/api$/, "");
      const faqUrl = `${baseUrl}/faq`;

      Linking.canOpenURL(faqUrl).then((supported) => {
        if (supported) {
          Linking.openURL(faqUrl);
        } else {
          Alert.alert("Error", "Unable to open FAQ page. Please visit the web app.");
        }
      }).catch(() => {
        Alert.alert("Error", "Unable to open FAQ page. Please visit the web app.");
      });
    } else {
      // Placeholder for future topic navigation
      Alert.alert(topic.title, "This help topic is coming soon!");
    }
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title="Help & Support" showBack />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Icon name="chatbubbles-outline" size={22} color="#FF4D4F" />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Need fast help?</Text>
            <Text style={styles.cardDescription}>
              We're online 9am – 6pm SGT, Monday to Friday. Drop us a message and we'll get back quickly.
            </Text>
          </View>
          <TouchableOpacity style={styles.cardButton} onPress={handleChatNow}>
            <Text style={styles.cardButtonText}>Chat now</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Popular topics</Text>
        <View style={styles.topicsList}>
          {helpTopics.map((topic) => (
            <TouchableOpacity
              key={topic.title}
              style={styles.topicItem}
              activeOpacity={0.75}
              onPress={() => handleTopicPress(topic)}
            >
              <View style={styles.topicIconWrapper}>
                <Icon name={topic.icon} size={20} color="#FF4D4F" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.topicDescription}>{topic.description}</Text>
              </View>
              <Icon name="chevron-forward" size={18} color="#bbb" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Still need help?</Text>
          <Text style={styles.footerDescription}>
            Email us at support@topcare.fashion or visit the FAQ in our web app for detailed guides.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    rowGap: 24,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: 12,
    backgroundColor: "#fff5f5",
    borderRadius: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  cardDescription: {
    fontSize: 13,
    color: "#555",
    marginTop: 6,
    lineHeight: 18,
  },
  cardButton: {
    backgroundColor: "#FF4D4F",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    alignSelf: "center",
  },
  cardButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  topicsList: {
    borderRadius: 16,
    backgroundColor: "#f8f8f8",
  },
  topicItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    columnGap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e5",
  },
  topicIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffe3e3",
    alignItems: "center",
    justifyContent: "center",
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  topicDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginTop: 4,
  },
  footerCard: {
    backgroundColor: "#fafafa",
    borderRadius: 16,
    padding: 16,
    rowGap: 8,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  footerDescription: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
  },
});
