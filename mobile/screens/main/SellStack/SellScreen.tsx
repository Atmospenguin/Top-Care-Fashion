import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";

export default function SellScreen() {
  const [description, setDescription] = useState("");

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={styles.header}>Sell an item</Text>

      {/* 上传图片 */}
      <View style={styles.photoRow}>
        {[...Array(5)].map((_, i) => (
          <TouchableOpacity key={i} style={styles.photoBox}>
            <Text style={{ fontSize: 24, color: "#999" }}>＋</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.photoTips}>Read our photo tips</Text>

      {/* 描述 */}
      <Text style={styles.sectionTitle}>Description</Text>
      <TextInput
        style={styles.input}
        placeholder="eg. small grey Nike t-shirt, only worn a few times"
        multiline
        value={description}
        onChangeText={setDescription}
      />

      {/* Info */}
      <Text style={styles.sectionTitle}>Info</Text>
      <TouchableOpacity style={styles.selectBtn}>
        <Text style={styles.selectText}>Category: Select</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.selectBtn}>
        <Text style={styles.selectText}>Brand: Select</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.selectBtn}>
        <Text style={styles.selectText}>Condition: Select</Text>
      </TouchableOpacity>

      {/* Price */}
      <Text style={styles.sectionTitle}>Price</Text>
      <TextInput style={styles.input} placeholder="$ 0.00" keyboardType="numeric" />

      {/* Shipping */}
      <Text style={styles.sectionTitle}>Shipping</Text>
      <TouchableOpacity style={styles.selectBtn}>
        <Text style={styles.selectText}>Domestic: Select</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.selectBtn}>
        <Text style={styles.selectText}>Worldwide: Optional</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.selectBtn}>
        <Text style={styles.selectText}>Location: Singapore</Text>
      </TouchableOpacity>

      {/* 底部按钮 */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.draftBtn}>
          <Text style={styles.draftText}>Save to drafts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postBtn}>
          <Text style={styles.postText}>Post listing</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },

  header: { fontSize: 20, fontWeight: "700", marginBottom: 16 },

  photoRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  photoBox: {
    width: 70,
    height: 70,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  photoTips: { fontSize: 14, color: "#5B21B6", marginBottom: 16 },

  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 15,
    backgroundColor: "#fafafa",
  },

  selectBtn: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  selectText: { fontSize: 15, color: "#333" },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  draftBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
  },
  draftText: { fontWeight: "600", fontSize: 16 },

  postBtn: {
    flex: 1,
    backgroundColor: "#000",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
  },
  postText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
