import { cookies } from "next/headers";
import { createBrowserClient, createServerClient, type CookieOptions } from "@supabase/ssr";

function resolveServerEnv(primary: string, fallbacks: string[]): string | undefined {
  const keys = [primary, ...fallbacks];
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim().length) {
      return value;
    }
  }
  return undefined;
}

function assertClientEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(
      `${name} is required. Add it in your environment variables (Vercel Settings → Environment Variables).`
    );
  }
  return value;
}

export async function createSupabaseServer() {
  const cookieStore = await cookies();
  const supabaseUrl =
    resolveServerEnv("NEXT_PUBLIC_SUPABASE_URL", [
      "DATABASE_SUPABASE_URL",
      "DATABASE_NEXT_PUBLIC_SUPABASE_URL",
    ]) ?? "";
  const supabaseAnonKey =
    resolveServerEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", [
      "DATABASE_SUPABASE_ANON_KEY",
      "DATABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]) ?? "";

  console.log("🔍 Supabase Server Config:", {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "missing",
    key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : "missing"
  });

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase URL or anon key missing. Set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (or their DATABASE_* equivalents) in your environment."
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieOptions) {
        try {
          cookieStore.set(name, value, options);
        } catch (error) {
          // 忽略 cookie 设置错误，可能是在中间件中调用
          console.warn(`Failed to set cookie ${name}:`, error);
        }
      },
      remove(name: string, options?: CookieOptions) {
        try {
          cookieStore.set(name, "", { ...options, maxAge: 0 });
        } catch (error) {
          // 忽略 cookie 删除错误
          console.warn(`Failed to remove cookie ${name}:`, error);
        }
      },
    },
  });
}

export function createSupabaseBrowser() {
  const supabaseUrl = assertClientEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = assertClientEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}


