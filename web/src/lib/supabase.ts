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

export function createSupabaseServer() {
  const cookieStore = cookies();
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

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase URL or anon key missing. Set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (or their DATABASE_* equivalents) in your environment."
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      async get(name: string) {
        const store = await cookieStore;
        return store.get(name)?.value;
      },
      async set(name: string, value: string, options?: CookieOptions) {
        const store = await cookieStore;
        store.set(name, value, options);
      },
      async remove(name: string, options?: CookieOptions) {
        const store = await cookieStore;
        store.set(name, "", { ...options, maxAge: 0 });
      },
    },
  });
}

export function createSupabaseBrowser() {
  const supabaseUrl = assertClientEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = assertClientEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}


