import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { authService } from "@/features/auth/services/auth";
import type { LoginRequest, User } from "@/types/generated";
import { useNotificationStore } from "./useNotificationStore";

// 初始化 Promise 缓存（防止并发调用 initAuth）
let initPromise: Promise<void> | null = null;

interface UserState {
  // 状态
  currentUser: User | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  login: (credentials: LoginRequest) => Promise<User>;
  logout: () => void;
  initAuth: () => Promise<void>;
  refreshUserInfo: () => Promise<User | null>;
  clearAuthData: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isLoading: false,
      isInitialized: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(credentials);

          // 保存 Token
          localStorage.setItem("authToken", response.access_token);
          localStorage.setItem(
            "tokenExpiresIn",
            response.expires_in.toString(),
          );

          // 更新状态
          set({ currentUser: response.user });

          // 显示通知
          const userName = response.user.display_name || response.user.username;
          useNotificationStore
            .getState()
            .success("登录成功", `欢迎回来，${userName}！`);

          return response.user;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        const userName =
          get().currentUser?.display_name ||
          get().currentUser?.username ||
          "用户";

        // 清除状态和存储
        get().clearAuthData();

        // 显示通知
        useNotificationStore
          .getState()
          .info("已安全退出", `再见，${userName}！`);
      },

      initAuth: async () => {
        // 如果已经有初始化 Promise 在执行，直接返回它
        if (initPromise) return initPromise;
        if (get().isInitialized) return;

        initPromise = (async () => {
          set({ isInitialized: true, isLoading: true });

          try {
            const token = localStorage.getItem("authToken");
            const storedUser = get().currentUser;

            if (token && storedUser) {
              // 异步验证 Token
              const result = await authService.verifyToken();

              if (!result.isValid) {
                if (!result.isNetworkError) {
                  get().clearAuthData();
                }
              }
            }
          } catch {
            // 初始化认证时的错误静默处理
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
        } catch {
          get().logout();
          throw new Error("刷新用户信息失败");
        }
      },

      clearAuthData: () => {
        set({ currentUser: null });
        localStorage.removeItem("authToken");
        localStorage.removeItem("tokenExpiresIn");
        localStorage.removeItem("refreshToken");
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
      return "管理员";
    case "teacher":
      return "教师";
    case "user":
      return "用户";
    default:
      return "";
  }
};

export const useUserAvatar = () => {
  const role = useUserStore((s) => s.currentUser?.role);
  switch (role) {
    case "admin":
      return "管";
    case "teacher":
      return "师";
    case "user":
      return "用";
    default:
      return "用";
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
