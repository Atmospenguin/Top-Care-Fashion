// 在移动应用的任何屏幕中添加这个调试功能
import { apiClient } from '../services/api';

// 显示当前 JWT Token
const showCurrentToken = async () => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    console.log("🔑 Current stored JWT Token:", token);
    
    if (token) {
      // 解码 JWT payload (中间部分)
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log("🔍 JWT Payload:", payload);
        console.log("👤 User ID:", payload.uid);
        console.log("⏰ Issued At:", new Date(payload.iat * 1000));
        console.log("⏰ Expires At:", new Date(payload.exp * 1000));
      }
    } else {
      console.log("❌ No token found");
    }
  } catch (error) {
    console.error("❌ Error reading token:", error);
  }
};

// 调用这个函数来显示 token
showCurrentToken();
