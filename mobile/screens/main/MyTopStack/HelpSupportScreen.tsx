import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import Header from "../../../components/Header";
import Icon from "../../../components/Icon";

const helpTopics = [
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

export default function HelpSupportScreen() {
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
          <TouchableOpacity style={styles.cardButton}>
            <Text style={styles.cardButtonText}>Chat now</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Popular topics</Text>
        <View style={styles.topicsList}>
          {helpTopics.map((topic) => (
            <TouchableOpacity key={topic.title} style={styles.topicItem} activeOpacity={0.75}>
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
