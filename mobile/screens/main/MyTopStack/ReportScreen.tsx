import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import Header from "../../../components/Header";
import { reportsService } from "../../../src/services";
import { useAuth } from "../../../contexts/AuthContext";

const reportReasons = [
  "Suspicious activity",
  "Inappropriate content",
  "Counterfeit item",
  "Payment issue",
  "Harassment or abuse",
];

export default function ReportScreen() {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert("Select a reason", "Please pick the issue you're reporting.");
      return;
    }

    try {
      setIsSubmitting(true);
      await reportsService.submitReport({
        targetType: "user",
        targetId: user?.id ? `support:${user.id}` : "support",
        category: selectedReason,
        details,
        reportedUsername: user?.username,
      });
      Alert.alert("Report submitted", "Thanks for letting us know. We'll review it shortly.");
      setSelectedReason(null);
      setDetails("");
    } catch (error) {
      console.error("Error submitting report:", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to submit report. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title="Report an Issue" showBack />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.subtitle}>
          Tell us what's happening so we can help you quickly. We'll reach out if we need more information.
        </Text>

        <Text style={styles.sectionTitle}>What's going on?</Text>
        <View style={styles.reasonsBox}>
          {reportReasons.map((reason) => {
            const selected = reason === selectedReason;
            return (
              <TouchableOpacity
                key={reason}
                style={[styles.reasonItem, selected && styles.reasonItemSelected]}
                onPress={() => setSelectedReason(reason)}
                activeOpacity={0.8}
              >
                <Text style={[styles.reasonText, selected && styles.reasonTextSelected]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Additional details</Text>
        <TextInput
          style={styles.input}
          placeholder="Provide context, order numbers, user names, links, or anything that helps us investigate."
          multiline
          numberOfLines={6}
          value={details}
          onChangeText={setDetails}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting ? { opacity: 0.6 } : undefined]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitText}>
            {isSubmitting ? "Submitting..." : "Submit report"}
          </Text>
        </TouchableOpacity>
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
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: "#555",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  reasonsBox: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e2e2e2",
    overflow: "hidden",
  },
  reasonItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ededed",
    backgroundColor: "#fafafa",
  },
  reasonItemSelected: {
    backgroundColor: "#ffefef",
  },
  reasonText: {
    fontSize: 15,
    color: "#333",
  },
  reasonTextSelected: {
    fontWeight: "700",
    color: "#FF4D4F",
  },
  input: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
    padding: 16,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 140,
    backgroundColor: "#fff",
  },
  submitButton: {
    backgroundColor: "#FF4D4F",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
