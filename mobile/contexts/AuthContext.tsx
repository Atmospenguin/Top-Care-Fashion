import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signIn, signUp, signOut, getCurrentUser, forgotPassword, resetPassword } from '../api';

// 用户类型定义 (匹配 Web API)
export interface User {
  id: number;
  username: string;
  email: string;
  role: "User" | "Admin";
  status: "active" | "suspended";
  isPremium: boolean;
  premiumUntil?: string | null;
  dob?: string | null;
  gender?: "Male" | "Female" | null;
  avatar_url?: string | null;
  phone?: string | null;
  bio?: string | null;
  location?: string | null;
  created_at?: string;
  updated_at?: string;
}

// 认证上下文类型
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateUser: (updatedUser: User) => void;
  error: string | null;
  clearError: () => void;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 检查用户是否已登录
  const isAuthenticated = !!user;

  // 清除错误
  const clearError = () => setError(null);

  // 登录
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await signIn(email, password);
      
      if (response.data?.user) {
        setUser(response.data.user);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 注册
  const register = async (username: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await signUp(username, email, password);
      
      if (response.data?.user) {
        setUser(response.data.user);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      setError(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 登出
  const logout = async () => {
    try {
      setLoading(true);
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  // 请求密码重置
  const requestPasswordReset = async (email: string) => {
    try {
      setError(null);
      await forgotPassword(email);
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email');
      throw error;
    }
  };

  // 重置密码
  const resetPasswordHandler = async (token: string, newPassword: string) => {
    try {
      setError(null);
      await resetPassword(token, newPassword);
    } catch (error: any) {
      setError(error.message || 'Failed to reset password');
      throw error;
    }
  };

  // 更新用户信息
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  // 应用启动时检查用户登录状态（仅在存在本地 token 时触发服务器查询）
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('auth_token');
        if (!token) {
          setUser(null);
          return;
        }
        const response: any = await getCurrentUser();
        if (response && response.data && response.data.user) setUser(response.data.user);
        else setUser(null);
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
    // 移动端不订阅 Supabase 事件，完全依赖 Web API
    return () => {};
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    requestPasswordReset,
    resetPassword: resetPasswordHandler,
    updateUser,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 使用认证上下文的 Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


