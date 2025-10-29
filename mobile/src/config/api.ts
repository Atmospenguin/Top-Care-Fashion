// mobile/src/config/api.ts
// Global API configuration for Top Care Fashion

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://top-care-fashion-cyan.vercel.app"; // sensible default

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
    },
    PROFILE: "/api/profile",
    FEEDBACK: "/api/feedback",
    FAQ: "/api/faq",
    SITE_STATS: "/api/site-stats",
    AI: {
      CLASSIFY: "/api/ai/classify",
      DESCRIBE: "/api/ai/describe",
      SAFE: "/api/ai/safe",
    },
    PROFILE: '/api/profile',
    FEEDBACK: '/api/feedback',
    FAQ: '/api/faq',
    SITE_STATS: '/api/site-stats',
    REPORTS: '/api/reports',
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
