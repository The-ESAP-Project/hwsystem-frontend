import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/sonner";
import { authService } from "@/features/auth/services/auth";
import { useDarkMode } from "@/hooks/useDarkMode";
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
        } catch {
          // 刷新失败，清除认证状态
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
        <TokenRefresher />
        {children}
        <Toaster richColors position="top-right" />
      </AuthInitializer>
    </QueryClientProvider>
  );
}
