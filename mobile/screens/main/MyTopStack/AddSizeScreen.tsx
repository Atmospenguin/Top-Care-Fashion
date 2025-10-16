import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Pressable,
} from "react-native";
import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MyTopStackParamList } from "./index";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";

type AddSizeNav = NativeStackNavigationProp<MyTopStackParamList, "AddSize">;
type AddSizeRoute = RouteProp<MyTopStackParamList, "AddSize">;

export default function AddSizeScreen() {
  const navigation = useNavigation<AddSizeNav>();
  const route = useRoute<AddSizeRoute>();
  const initialSizes = useMemo(
    () => route.params?.selectedSizes ?? {},
    [route.params]
  );

  // Size states
  const [shoeSize, setShoeSize] = useState(initialSizes.shoe ?? "Select");
  const [topSize, setTopSize] = useState(initialSizes.top ?? "Select");
  const [bottomSize, setBottomSize] = useState(initialSizes.bottom ?? "Select");

  // Picker visibility
  const [showShoePicker, setShowShoePicker] = useState(false);
  const [showTopPicker, setShowTopPicker] = useState(false);
  const [showBottomPicker, setShowBottomPicker] = useState(false);

  const SIZE_OPTIONS_CLOTHES = [
    "XXS / EU 32 / UK 4 / US 0",
    "XS / EU 34 / UK 6 / US 2",
    "S / EU 36 / UK 8 / US 4",
    "M / EU 38 / UK 10 / US 6",
    "L / EU 40 / UK 12 / US 8",
    "XL / EU 42 / UK 14 / US 10",
    "XXL / EU 44 / UK 16 / US 12",
    "XXXL / EU 46 / UK 18 / US 14",
  ];

  const SIZE_OPTIONS_SHOES = [
    "EU 35 / US 5 / UK 3",
    "EU 36 / US 6 / UK 4",
    "EU 37 / US 6.5 / UK 4.5",
    "EU 38 / US 7 / UK 5",
    "EU 39 / US 8 / UK 6",
    "EU 40 / US 9 / UK 7",
    "EU 41 / US 10 / UK 8",
    "EU 42 / US 11 / UK 9",
    "EU 43 / US 12 / UK 10",
  ];

  const OptionPicker = ({
    title,
    visible,
    options,
    value,
    onClose,
    onSelect,
  }: {
    title: string;
    visible: boolean;
    options: string[];
    value: string;
    onClose: () => void;
    onSelect: (value: string) => void;
  }) => (
    <Modal transparent animationType="slide" visible={visible}>
      <Pressable style={styles.sheetMask} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>{title}</Text>
        <ScrollView style={{ maxHeight: 360 }}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.optionRow,
                value === opt && {
                  backgroundColor: "#F3E8FF",
                  borderColor: "#5B21B6",
                },
              ]}
              onPress={() => {
                onSelect(opt);
                onClose();
              }}
            >
              <Text style={styles.optionText}>{opt}</Text>
              {value === opt ? <Text style={{ color: "#5B21B6" }}>✓</Text> : null}
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.sheetCancel} onPress={onClose}>
          <Text style={{ fontWeight: "600" }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title="Sizes" showBack />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.helperText}>
          This will help you see items that are more relevant
        </Text>

        {/* Shoe size */}
        <Text style={styles.label}>Shoe Size</Text>
        <TouchableOpacity
          style={styles.selectBtn}
          onPress={() => setShowShoePicker(true)}
        >
          <Text style={styles.selectText}>{shoeSize}</Text>
        </TouchableOpacity>

        {/* Top size */}
        <Text style={styles.label}>Top Size</Text>
        <TouchableOpacity
          style={styles.selectBtn}
          onPress={() => setShowTopPicker(true)}
        >
          <Text style={styles.selectText}>{topSize}</Text>
        </TouchableOpacity>

        {/* Bottom size */}
        <Text style={styles.label}>Bottom Size</Text>
        <TouchableOpacity
          style={styles.selectBtn}
          onPress={() => setShowBottomPicker(true)}
        >
          <Text style={styles.selectText}>{bottomSize}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveBtn,
            shoeSize !== "Select" ||
            topSize !== "Select" ||
            bottomSize !== "Select"
              ? { backgroundColor: "#000" }
              : { backgroundColor: "#ccc" },
          ]}
          onPress={() =>
            navigation.navigate("MyPreference", {
              selectedSizes: {
                shoe: shoeSize !== "Select" ? shoeSize : undefined,
                top: topSize !== "Select" ? topSize : undefined,
                bottom: bottomSize !== "Select" ? bottomSize : undefined,
              },
            })
          }
        >
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Pickers */}
      <OptionPicker
        title="Select Shoe Size"
        visible={showShoePicker}
        options={SIZE_OPTIONS_SHOES}
        value={shoeSize}
        onClose={() => setShowShoePicker(false)}
        onSelect={setShoeSize}
      />
      <OptionPicker
        title="Select Top Size"
        visible={showTopPicker}
        options={SIZE_OPTIONS_CLOTHES}
        value={topSize}
        onClose={() => setShowTopPicker(false)}
        onSelect={setTopSize}
      />
      <OptionPicker
        title="Select Bottom Size"
        visible={showBottomPicker}
        options={SIZE_OPTIONS_CLOTHES}
        value={bottomSize}
        onClose={() => setShowBottomPicker(false)}
        onSelect={setBottomSize}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  helperText: { color: "#555", fontSize: 14, marginBottom: 20 },
  label: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  selectBtn: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  selectText: { fontSize: 15, color: "#111" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
  },
  saveBtn: {
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  sheetMask: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#DDD",
    marginBottom: 8,
  },
  sheetTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  optionRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionText: { fontSize: 15, color: "#111" },
  sheetCancel: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F6F6F6",
    alignItems: "center",
  },
});