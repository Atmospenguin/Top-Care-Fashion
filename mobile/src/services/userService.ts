import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { apiClient } from "./api";
import { API_CONFIG } from "../config/api";
import type { User } from "./authService";

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
  avatar_url?: string | null;
  phone?: string | null;
  bio?: string | null;
  location?: string | null;
  dob?: string | null;
  gender?: "Male" | "Female" | null;
}

export class UserService {
  async getProfile(): Promise<User | null> {
    const res = await apiClient.get<User>(API_CONFIG.ENDPOINTS.PROFILE);
    return res.data || null;
  }

  async updateProfile(profileData: UpdateProfileRequest): Promise<User> {
    console.log("🔄 Calling updateProfile with:", JSON.stringify(profileData, null, 2));
    console.log("🔄 API endpoint:", API_CONFIG.ENDPOINTS.PROFILE);
    
    const res = await apiClient.patch<User>(
      API_CONFIG.ENDPOINTS.PROFILE,
      profileData
    );
    
    console.log("🔄 UpdateProfile response:", res);
    
    if (!res.data) throw new Error("Profile update failed");
    return res.data;
  }

  // ✅ 修复后的头像上传：支持 FormData + base64 fallback
  async uploadAvatar(imageUri: string): Promise<string> {
    try {
      console.log("📸 Starting avatar upload...");
      const fileName = imageUri.split("/").pop() || "avatar.jpg";
      const fileType = fileName.endsWith(".png") ? "image/png" : "image/jpeg";

      // --- 方法 1：fetch + FormData ---
      try {
        const formData = new FormData();
        formData.append("avatar", {
          uri: Platform.OS === "ios" ? imageUri.replace("file://", "") : imageUri,
          name: fileName,
          type: fileType,
        } as any);

        console.log("👉 Trying FormData upload...");
        console.log("📸 Image URI:", imageUri);
        console.log("📸 File name:", fileName);
        console.log("📸 File type:", fileType);
        console.log("📸 API endpoint:", `${API_CONFIG.ENDPOINTS.PROFILE}/avatar`);
        
        const response = await apiClient.post<{ avatarUrl: string }>(
          `${API_CONFIG.ENDPOINTS.PROFILE}/avatar`,
          formData
        );

        console.log("✅ FormData upload success:", response.data);
        return response.data!.avatarUrl;
      } catch (err) {
        console.warn("⚠️ FormData upload threw:", err);
        throw err; // 重新抛出错误以触发 fallback
      }

      // --- 方法 2：base64 fallback ---
      console.log("🔁 Fallback to base64 upload...");
      const base64Data = await this.convertImageToBase64(imageUri);
      const res = await apiClient.post<{ avatarUrl: string }>(
        `${API_CONFIG.ENDPOINTS.PROFILE}/avatar-base64`,
        { imageData: base64Data, fileName }
      );

      if (res.data?.avatarUrl) {
        return res.data!.avatarUrl;
      }
      throw new Error("Avatar upload failed: no avatarUrl");
    } catch (error) {
      console.error("❌ Avatar upload error:", error);
      throw error;
    }
  }

  private async convertImageToBase64(uri: string): Promise<string> {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64' as any,
    });
    return base64;
  }

  async deleteAvatar(): Promise<void> {
    await apiClient.delete(`${API_CONFIG.ENDPOINTS.PROFILE}/avatar`);
  }
}

export const userService = new UserService();