// EditProfileScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  type ImageSourcePropType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ✅ 1) 引入默认头像（你们 constants 里导出的那个）
import { DEFAULT_AVATAR } from "../../../constants/assetUrls";

// ✅ 2) 引入封装好的图标组件（Ionicons）
import Icon from "../../../components/Icon";

export default function EditProfileScreen() {
  const [avatar, setAvatar] = useState<ImageSourcePropType>(DEFAULT_AVATAR);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Edit Profile</Text>

        {/* 头像 */}
        <View style={styles.avatarWrapper}>
          <Image source={avatar} style={styles.avatar} />
          <TouchableOpacity
            style={styles.cameraBtn}
            onPress={() => {
              console.log("Change avatar clicked");
            }}
          >
            {/* ✅ 3) 这里用 Icon（注意没有奇怪的隐藏字符） */}
            <Icon name="camera-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* 表单 */}
        <Text style={styles.label}>Username</Text>
        <TextInput style={styles.input} defaultValue="ccc446981" />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={styles.input}
          defaultValue="My name is Pink, and I'm really glad to meet you"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} defaultValue="ccc446981@gmail.com" />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} defaultValue="88074566" />

        <Text style={styles.label}>Date of Birth</Text>
        <TextInput style={styles.input} defaultValue="23/05/2005" />

        <Text style={styles.label}>Country/Region</Text>
        <TextInput style={styles.input} defaultValue="Singapore" />

        <TouchableOpacity style={styles.saveBtn}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const AVATAR_SIZE = 120;

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, rowGap: 12 },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 12 },

  avatarWrapper: { alignItems: "center", marginBottom: 16 },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, backgroundColor: "#eee" },
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: (AVATAR_SIZE - 36) / 2, // 让按钮靠右下
    backgroundColor: "#FF4D4F",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  label: { fontSize: 14, fontWeight: "600", marginTop: 8 },
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
    marginTop: 20,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
