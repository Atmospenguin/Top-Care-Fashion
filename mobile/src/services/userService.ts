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
    
    const res = await apiClient.patch<{ ok: boolean; user: User }>(
      API_CONFIG.ENDPOINTS.PROFILE,
      profileData
    );
    
    console.log("🔄 UpdateProfile response:", res);
    
    if (!res.data?.user) throw new Error("Profile update failed");
    
    // ✅ 返回更新后的完整用户数据
    return res.data.user;
  }

  // ✅ 修复后的头像上传：统一处理拍照和图库，支持 FormData + base64 fallback
  async uploadAvatar(imageUri: string, assetInfo?: any): Promise<string> {
    try {
      console.log("📸 Starting avatar upload...");
      console.log("📸 Image URI:", imageUri);
      console.log("📸 Asset info:", assetInfo);

      // ✅ 统一处理文件名和类型（兼容拍照和图库）
      let fileName: string;
      let fileType: string;

      if (assetInfo?.fileName) {
        // 图库模式：使用原始文件名
        fileName = assetInfo.fileName;
        fileType = assetInfo.type || "image/jpeg";
      } else {
        // 拍照模式：动态生成文件名
        const uriFileName = imageUri.split("/").pop() || "";
        const hasExtension = uriFileName.includes(".");
        
        if (hasExtension) {
          fileName = uriFileName;
          fileType = uriFileName.endsWith(".png") ? "image/png" : "image/jpeg";
        } else {
          // 拍照模式可能没有扩展名，动态生成
          fileName = `avatar_${Date.now()}.jpg`;
          fileType = "image/jpeg";
        }
      }

      // ✅ 确保文件类型正确（iOS拍照可能返回"image"）
      if (fileType === "image") {
        fileType = "image/jpeg";
      }

      console.log("📸 Final file name:", fileName);
      console.log("📸 Final file type:", fileType);

      // --- 方法 1：正确的 FormData 格式 ---
      try {
        const formData = new FormData();
        formData.append("file", {
          uri: imageUri,
          name: fileName,
          type: fileType,
        } as any);

        console.log("👉 Trying FormData upload...");
        console.log("📸 API endpoint:", `${API_CONFIG.ENDPOINTS.PROFILE}/avatar`);
        
        // ✅ 使用正确的API调用方式，不手动设置Content-Type
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