import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import Header from "../../../components/Header";

const policySections = [
  {
    title: "Terms of Service",
    summary:
      "These terms govern your use of the Top Care Fashion marketplace, including seller responsibilities and prohibited activities.",
  },
  {
    title: "Privacy Policy",
    summary:
      "Learn how we collect, use, and protect your personal data when you browse and make purchases on the platform.",
  },
  {
    title: "Community Guidelines",
    summary:
      "Keep the community safe by following our rules for communication, listings, and dispute resolution.",
  },
  {
    title: "Return & Refund Policy",
    summary:
      "Understand timelines, eligibility, and the process for returning items or requesting a refund.",
  },
];

export default function TermsPoliciesScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title="Terms & Policies" showBack />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.leadText}>
          Here's a quick overview of the key policies that keep the Top Care Fashion community fair and safe. Tap to read the full documents.
        </Text>

        <View style={styles.sectionList}>
          {policySections.map((section) => (
            <TouchableOpacity key={section.title} style={styles.sectionItem} activeOpacity={0.7}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionSummary}>{section.summary}</Text>
              <Text style={styles.sectionLink}>View full policy</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footerBox}>
          <Text style={styles.footerTitle}>Need a formal document?</Text>
          <Text style={styles.footerDescription}>
            Email legal@topcare.fashion and we'll send over a signed copy of the policy you need within 2 business days.
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
  leadText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#555",
  },
  sectionList: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e6e6e6",
  },
  sectionItem: {
    backgroundColor: "#fdfdfd",
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ededed",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  sectionSummary: {
    fontSize: 13,
    color: "#666",
    lineHeight: 19,
    marginTop: 6,
  },
  sectionLink: {
    fontSize: 13,
    color: "#FF4D4F",
    fontWeight: "600",
    marginTop: 10,
  },
  footerBox: {
    backgroundColor: "#faf9ff",
    borderRadius: 16,
    padding: 16,
    rowGap: 8,
  },
  footerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  footerDescription: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
  },
});
