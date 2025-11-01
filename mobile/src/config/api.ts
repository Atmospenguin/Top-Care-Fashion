// mobile/src/config/api.ts
// Global API configuration for Top Care Fashion

import Constants from "expo-constants";

const expoExtra = (Constants?.expoConfig?.extra ?? {}) as Record<string, unknown>;
const DEFAULT_PROD_API_BASE_URL = "https://top-care-fashion.vercel.app/";

function readEnv(key: string): string | undefined {
  const envValue = process.env[key];
  if (typeof envValue === "string" && envValue.trim().length > 0) {
    return envValue;
  }

  const extraValue = expoExtra[key];
  return typeof extraValue === "string" && extraValue.trim().length > 0 ? extraValue : undefined;
}

const preferLocalInDev = (() => {
  const raw = readEnv("EXPO_PUBLIC_PREFER_LOCAL_API");
  if (raw === undefined) {
    return false; // ✅ 默认禁用自动使用本地开发服务器
  }

  const normalized = raw.trim().toLowerCase();
  return normalized !== "0" && normalized !== "false";
})();

function resolveDevBaseUrl(): string | undefined {
  if (!__DEV__ || !preferLocalInDev) {
    return undefined;
  }

  const expoAny = Constants as Record<string, any>;
  const hostCandidates: Array<string | undefined> = [
    typeof Constants?.expoConfig?.hostUri === "string" ? Constants.expoConfig.hostUri : undefined,
    typeof expoAny?.expoGoConfig?.hostUri === "string" ? expoAny.expoGoConfig.hostUri : undefined,
    typeof expoAny?.expoGoConfig?.debuggerHost === "string" ? expoAny.expoGoConfig.debuggerHost : undefined,
    typeof expoAny?.manifest?.debuggerHost === "string" ? expoAny.manifest.debuggerHost : undefined,
    typeof expoAny?.manifest2?.extra?.expoClient?.hostUri === "string"
      ? expoAny.manifest2.extra.expoClient.hostUri
      : undefined,
    typeof expoAny?.manifest2?.extra?.expoClient?.debuggerHost === "string"
      ? expoAny.manifest2.extra.expoClient.debuggerHost
      : undefined,
    readEnv("EXPO_DEV_SERVER_HOST"),
    readEnv("REACT_NATIVE_PACKAGER_HOSTNAME"),
  ];

  const hostUri = hostCandidates.find((candidate): candidate is string => typeof candidate === "string" && candidate.length > 0);
  if (!hostUri) {
    return undefined;
  }

  const host = hostUri.split(":")[0];
  if (!host) {
    return undefined;
  }

  const port = readEnv("EXPO_PUBLIC_DEV_API_PORT") ?? "3000";
  const localOverride = readEnv("EXPO_LOCAL_HOST_ADDRESS")?.trim();

  if (host === "127.0.0.1" || host === "localhost" || host.endsWith(".exp.direct")) {
    if (localOverride && localOverride.length > 0) {
      return `http://${localOverride}:${port}`;
    }

    // Expo tunnel hosts (xxx.exp.direct) cannot reach arbitrary local ports by default; fall back to configured base.
    if (host.endsWith(".exp.direct")) {
      return undefined;
    }

    // For desktop simulators, localhost may still work; otherwise fall back to configured base URL.
    return `http://${host}:${port}`;
  }

  return `http://${host}:${port}`;
}

const configuredBaseUrl = readEnv("EXPO_PUBLIC_API_URL") ?? readEnv("EXPO_PUBLIC_API_BASE_URL");
const resolvedBaseUrl = resolveDevBaseUrl() ?? configuredBaseUrl ?? DEFAULT_PROD_API_BASE_URL;

export const API_BASE_URL = resolvedBaseUrl;

if (__DEV__) {
  // Surface the active target to make debugging multi-environment flows easier.
  // eslint-disable-next-line no-console
  console.info(`[api] Using base URL: ${API_BASE_URL}`);
}

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    LISTINGS: "/api/listings",
    USERS: "/api/users",
    AUTH: {
      SIGNIN: "/api/auth/signin",
      SIGNUP: "/api/auth/register",
      ME: "/api/auth/me",
      SIGNOUT: "/api/auth/signout",
      FORGOT_PASSWORD: "/api/auth/forgot-password",
      RESET_PASSWORD: "/api/auth/reset-password",
      CHANGE_PASSWORD: "/api/auth/change-password",
    },
    PROFILE: "/api/profile",
    FEEDBACK: "/api/feedback",
    FAQ: "/api/faq",
    SITE_STATS: "/api/site-stats",
    LIKES: "/api/likes",
    ORDERS: "/api/orders",
    AI: {
      CLASSIFY: "/api/ai/classify",
      DESCRIBE: "/api/ai/describe",
      SAFE: "/api/ai/safe",
    },
    REPORTS: "/api/reports",
  },
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  
  // 已废弃：统一通过 apiClient 注入 Authorization 头
  // 保留空实现以兼容旧代码，但请不要再使用
  getAuthHeaders: () => ({}),
} as const;

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  constructor(public message: string, public status: number, public response?: any) {
    super(message);
    this.name = "ApiError";
  }
}

// Normalize slashes; prevent POST→GET via redirects or misformed URLs
export function buildUrl(path: string) {
  return `${API_BASE_URL.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export const DEBUG_API = process.env.EXPO_PUBLIC_DEBUG_API === "1";
