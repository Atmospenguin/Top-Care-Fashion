import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type PlanOptionCardProps = {
  prefix: string;
  highlight: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
};

const PlanOptionCard: React.FC<PlanOptionCardProps> = ({
  prefix,
  highlight,
  selected = false,
  onPress,
  disabled,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[styles.card, selected && styles.cardSelected, disabled && styles.cardDisabled]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
      <Text style={styles.label}>
        {prefix}
        <Text style={styles.highlight}>{highlight}</Text>
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  cardSelected: {
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  cardDisabled: {
    opacity: 0.6,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  radioSelected: {
    borderColor: "#FFFFFF",
  },
  radioDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#FFFFFF",
  },
  label: {
    flex: 1,
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  highlight: {
    fontSize: 19,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});

export default PlanOptionCard;