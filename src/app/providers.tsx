import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/sonner";
import { authService } from "@/features/auth/services/auth";
import { useDarkMode } from "@/hooks/useDarkMode";
import { logger } from "@/lib/logger";
import { useUserStore } from "@/stores/useUserStore";
import "@/app/i18n";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function AuthInitializer({ children }: { children: ReactNode }) {
  const initAuth = useUserStore((s) => s.initAuth);
  const initDarkMode = useDarkMode((s) => s.init);

  useEffect(() => {
    initAuth();
    initDarkMode();
  }, [initAuth, initDarkMode]);

  return <>{children}</>;
}

/**
 * 监听用户变化，自动清空 React Query 缓存
 * 解决切换账号后看到旧用户数据的问题
 */
function CacheManager() {
  const currentUser = useUserStore((s) => s.currentUser);
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const currentUserId = currentUser?.id;

    // 用户切换（包括登出后登录新账号）时清除缓存
    // 注意：首次加载时 prevUserIdRef.current 是 undefined，不触发清缓存
    if (
      prevUserIdRef.current !== undefined &&
      prevUserIdRef.current !== currentUserId
    ) {
      queryClient.clear();
    }

    prevUserIdRef.current = currentUserId;
  }, [currentUser?.id, queryClient]);

  return null;
}

/**
 * 主动刷新 token 的组件
 * 在 token 快过期前自动刷新，作为 401 interceptor 的补充
 */
function TokenRefresher() {
  const currentUser = useUserStore((s) => s.currentUser);
  const clearAuthData = useUserStore((s) => s.clearAuthData);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!currentUser) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const scheduleRefresh = () => {
      const expiresIn = localStorage.getItem("tokenExpiresIn");
      if (!expiresIn) return;

      // 在过期前 1 分钟刷新，最少 60 秒后刷新
      const refreshTime = Math.max((Number(expiresIn) - 60) * 1000, 60000);

      timerRef.current = setTimeout(async () => {
        try {
          const response = await authService.refreshToken();
          localStorage.setItem("authToken", response.access_token);
          localStorage.setItem(
            "tokenExpiresIn",
            response.expires_in.toString(),
          );
          // 递归调度下次刷新
          scheduleRefresh();
        } catch (error) {
          // 刷新失败，记录错误并清除认证状态
          logger.error("Token refresh failed", error);
          clearAuthData();
        }
      }, refreshTime);
    };

    scheduleRefresh();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentUser, clearAuthData]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        <CacheManager />
        <TokenRefresher />
        {children}
        <Toaster richColors position="top-right" />
      </AuthInitializer>
    </QueryClientProvider>
  );
}
