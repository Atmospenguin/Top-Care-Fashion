import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView, // ✅ 补上
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons"; // ✅ 补上

// 引入默认头像
import { DEFAULT_AVATAR } from "../../../constants/assetUrls";

export default function EditProfileScreen() {
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);

  // ✅ 临时 mock 数据，避免报错
  const mockUser = {
    username: "ccc446981",
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 顶部：用户名 + 设置 */}
        <View style={styles.header}>
          <Text style={styles.username}>{mockUser.username}</Text>
          <TouchableOpacity onPress={() => console.log("Go to settings")}>
            <Ionicons name="settings-sharp" size={24} color="#111" />
          </TouchableOpacity>
        </View>

        {/* 头像 */}
        <View style={styles.avatarWrapper}>
          <Image source={avatar} style={styles.avatar} />
          <TouchableOpacity
            style={styles.cameraBtn}
            onPress={() => console.log("Change avatar clicked")}
          >
            <Text style={{ color: "#fff" }}>📷</Text>
          </TouchableOpacity>
        </View>

        {/* 表单 */}
        <Text style={styles.label}>Username</Text>
        <TextInput style={styles.input} value="ccc446981" />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={styles.input}
          value="My name is Pink, and I'm really glad to meet you"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value="ccc446981@gmail.com" />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} value="88074566" />

        <Text style={styles.label}>Date of Birth</Text>
        <TextInput style={styles.input} value="23/05/2005" />

        <Text style={styles.label}>Country/Region</Text>
        <TextInput style={styles.input} value="Singapore" />

        {/* 保存按钮 */}
        <TouchableOpacity style={styles.saveBtn}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  username: { fontSize: 18, fontWeight: "700" },

  avatarWrapper: { alignItems: "center", marginBottom: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#eee" },
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 120 / 3,
    backgroundColor: "#FF4D4F",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  label: { fontSize: 14, fontWeight: "600", marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },

  saveBtn: {
    backgroundColor: "#FF4D4F",
    padding: 14,
    borderRadius: 30,
    marginTop: 30,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
