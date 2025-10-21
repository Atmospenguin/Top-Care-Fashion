import Constants from 'expo-constants';

// API 配置文件
export const API_CONFIG = {
  // 你的 Web API 基础 URL
  // 从 app.json 的 extra 字段获取，或回退到环境变量
  BASE_URL: Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  
  // API 端点
  ENDPOINTS: {
    LISTINGS: '/api/listings',
    USERS: '/api/users',
    AUTH: {
      SIGNIN: '/api/auth/signin',
      SIGNUP: '/api/auth/register',
      ME: '/api/auth/me',
      SIGNOUT: '/api/auth/signout',
    },
    PROFILE: '/api/profile',
    FEEDBACK: '/api/feedback',
    FAQ: '/api/faq',
    SITE_STATS: '/api/site-stats',
  },
  
  // 请求配置
  TIMEOUT: 10000, // 10秒超时
  RETRY_ATTEMPTS: 3,
} as const;

// API 响应类型
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// 错误类型
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}


