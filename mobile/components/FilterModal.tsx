import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import Icon from "./Icon";

export type FilterOptionValue = string | number;

export type FilterOption = {
  label: string;
  value: FilterOptionValue;
};

export type FilterSection = {
  key: string;
  title: string;
  options: FilterOption[];
  selectedValue: FilterOptionValue;
  onSelect: (value: FilterOptionValue) => void;
  type?: "chip"; // Default is chip
};

export type RangeFilterSection = {
  key: string;
  title: string;
  type: "range";
  minValue: number;
  maxValue: number;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
};

type AllFilterSection = FilterSection | RangeFilterSection;

type FilterModalProps = {
  visible: boolean;
  title?: string;
  sections: AllFilterSection[];
  onClose: () => void;
  onApply: () => void;
  onClear?: () => void;
  applyButtonLabel?: string;
};

function FilterModal({
  visible,
  title = "Filters",
  sections,
  onClose,
  onApply,
  onClear,
  applyButtonLabel = "Apply Filters",
}: FilterModalProps) {
  const isRangeSection = (section: AllFilterSection): section is RangeFilterSection => {
    return section.type === "range";
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={onClose} accessibilityRole="button">
                <Icon name="close" size={24} color="#111" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{title}</Text>
              {onClear ? (
                <TouchableOpacity onPress={onClear} accessibilityRole="button">
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 48 }} />
              )}
            </View>

            <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
              {sections.map((section) => {
                if (isRangeSection(section)) {
                  return (
                    <View key={section.key}>
                      <Text style={styles.filterSectionTitle}>{section.title}</Text>
                      <View style={styles.rangeContainer}>
                        <TextInput
                          style={styles.rangeInput}
                          placeholder={section.minPlaceholder || "Min"}
                          placeholderTextColor="#999"
                          value={String(section.minValue)}
                          onChangeText={section.onMinChange}
                          keyboardType="decimal-pad"
                        />
                        <Text style={styles.rangeSeparator}>-</Text>
                        <TextInput
                          style={styles.rangeInput}
                          placeholder={section.maxPlaceholder || "Max"}
                          placeholderTextColor="#999"
                          value={String(section.maxValue)}
                          onChangeText={section.onMaxChange}
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </View>
                  );
                }

                return (
                  <View key={section.key}>
                    <Text style={styles.filterSectionTitle}>{section.title}</Text>
                    <View style={styles.filterOptions}>
                      {section.options.map((option) => {
                        const isActive = section.selectedValue === option.value;
                        return (
                          <TouchableOpacity
                            key={option.label}
                            style={[
                              styles.filterChip,
                              isActive && styles.filterChipActive,
                            ]}
                            onPress={() => section.onSelect(option.value)}
                            accessibilityRole="button"
                          >
                            <Text
                              style={[
                                styles.filterChipText,
                                isActive && styles.filterChipTextActive,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={onApply}
                accessibilityRole="button"
              >
                <Text style={styles.applyButtonText}>{applyButtonLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default React.memo(FilterModal);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e5",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  clearText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginTop: 16,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  filterChipActive: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  rangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
    marginBottom: 16,
  },
  rangeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111",
    backgroundColor: "#f9f9f9",
  },
  rangeSeparator: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e5e5",
  },
  applyButton: {
    backgroundColor: "#111",
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
