import { createClient } from "@supabase/supabase-js";
import Constants from 'expo-constants';

// 从 app.json 的 extra 字段获取环境变量
const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log("🔍 Supabase Config:");
console.log("🔍 URL:", supabaseUrl);
console.log("🔍 Anon Key exists:", !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase configuration is missing!");
  throw new Error("Supabase configuration is missing. Please check your app.json extra configuration.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
