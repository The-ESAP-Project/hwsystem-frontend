import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import i18n from "@/app/i18n";
import {
  adminNavItems,
  teacherNavItems,
  userNavItems,
} from "@/components/layout/DashboardLayout";
import { authService } from "@/features/auth/services/auth";
import { logger } from "@/lib/logger";
import type { LoginRequest, User } from "@/types/generated";
import { useNotificationStore } from "./useNotificationStore";

// 初始化 Promise 缓存（防止并发调用 initAuth）
let initPromise: Promise<void> | null = null;

interface UserState {
  // 状态
  currentUser: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  // Token 存储在内存中（XSS 防护）
  accessToken: string | null;
  tokenExpiresAt: number | null; // 毫秒时间戳

  // Actions
  login: (credentials: LoginRequest) => Promise<User>;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
  refreshUserInfo: () => Promise<User | null>;
  clearAuthData: () => void;
  setAccessToken: (token: string, expiresIn: number) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isLoading: false,
      isInitialized: false,
      accessToken: null,
      tokenExpiresAt: null,

      setAccessToken: (token, expiresIn) => {
        set({
          accessToken: token,
          tokenExpiresAt: Date.now() + Number(expiresIn) * 1000,
        });
      },

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(credentials);

          // Token 存入内存 store（不再存 localStorage）
          set({
            currentUser: response.user,
            accessToken: response.access_token,
            tokenExpiresAt: Date.now() + Number(response.expires_in) * 1000,
          });

          // 显示通知
          const userName = response.user.display_name || response.user.username;
          useNotificationStore
            .getState()
            .success(
              i18n.t("auth.login.success.title"),
              i18n.t("auth.login.success.message", { name: userName }),
            );

          return response.user;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        const userName =
          get().currentUser?.display_name ||
          get().currentUser?.username ||
          i18n.t("role.user");

        // 调用后端登出 API 清除 Refresh Token Cookie
        try {
          await authService.logout();
        } catch (error) {
          // 即使 API 调用失败也继续清除本地状态
          logger.warn(
            "Logout API failed, continuing with local cleanup",
            error,
          );
        }

        // 清除状态和存储
        // 缓存清理由 CacheManager 自动处理
        get().clearAuthData();

        // 显示通知
        useNotificationStore
          .getState()
          .info(
            i18n.t("auth.logout.success.title"),
            i18n.t("auth.logout.success.message", { name: userName }),
          );
      },

      initAuth: async () => {
        // 如果已经有初始化 Promise 在执行，直接返回它
        if (initPromise) return initPromise;
        if (get().isInitialized) return;

        initPromise = (async () => {
          set({ isInitialized: true, isLoading: true });

          // 清理旧版 localStorage 数据（迁移）
          localStorage.removeItem("authToken");
          localStorage.removeItem("tokenExpiresIn");
          localStorage.removeItem("refreshToken");

          try {
            const storedUser = get().currentUser;

            // 页面刷新后 accessToken 为 null，需要通过 refresh token 恢复
            if (storedUser && !get().accessToken) {
              try {
                const response = await authService.refreshToken();
                get().setAccessToken(
                  response.access_token,
                  Number(response.expires_in),
                );
              } catch {
                // refresh 失败，清除用户状态
                get().clearAuthData();
              }
            }
          } catch (error) {
            // 认证初始化失败时记录错误，但不阻塞应用
            logger.error("Auth initialization failed", error);
          } finally {
            set({ isLoading: false });
          }
        })();

        return initPromise;
      },

      refreshUserInfo: async () => {
        if (!get().currentUser) return null;

        try {
          const user = await authService.getCurrentUser();
          set({ currentUser: user });
          return user;
        } catch (error) {
          logger.error("Failed to refresh user info", error);
          get().logout();
          throw error;
        }
      },

      clearAuthData: () => {
        set({ currentUser: null, accessToken: null, tokenExpiresAt: null });
      },
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currentUser: state.currentUser }),
    },
  ),
);

// Selector Hooks (计算属性)
export const useIsAuthenticated = () =>
  useUserStore((s) => s.currentUser !== null);

export const useCurrentUser = () => useUserStore((s) => s.currentUser);

export const useUserRole = () => useUserStore((s) => s.currentUser?.role);

export const useDashboardPath = () => {
  const role = useUserStore((s) => s.currentUser?.role);
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "teacher":
      return "/teacher/dashboard";
    case "user":
      return "/user/dashboard";
    default:
      return "/";
  }
};

export const useRoleText = () => {
  const role = useUserStore((s) => s.currentUser?.role);
  switch (role) {
    case "admin":
      return i18n.t("role.admin");
    case "teacher":
      return i18n.t("role.teacher");
    case "user":
      return i18n.t("role.user");
    default:
      return "";
  }
};

export const useUserAvatarColor = () => {
  const role = useUserStore((s) => s.currentUser?.role);
  switch (role) {
    case "admin":
      return "bg-gradient-to-r from-red-500 to-orange-500";
    case "teacher":
      return "bg-gradient-to-r from-blue-500 to-indigo-500";
    case "user":
      return "bg-gradient-to-r from-green-500 to-emerald-500";
    default:
      return "bg-gradient-to-r from-gray-500 to-gray-600";
  }
};

export const useRoleNavItems = () => {
  const role = useUserStore((s) => s.currentUser?.role);
  switch (role) {
    case "admin":
      return adminNavItems;
    case "teacher":
      return teacherNavItems;
    default:
      return userNavItems;
  }
};

export const useRolePrefix = () => {
  const role = useUserStore((s) => s.currentUser?.role);
  switch (role) {
    case "admin":
      return "admin";
    case "teacher":
      return "teacher";
    default:
      return "user";
  }
};
