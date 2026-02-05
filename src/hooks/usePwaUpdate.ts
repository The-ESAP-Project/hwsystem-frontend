import { useRegisterSW } from "virtual:pwa-register/react";
import { logger } from "@/lib/logger";

/**
 * PWA 自动更新 hook
 * 注册 Service Worker 并定期检查更新，检测到新版本时自动更新
 */
export function usePwaUpdate() {
  useRegisterSW({
    onRegistered(r) {
      logger.info("Service Worker registered:", r);
      // 每小时检查一次更新
      if (r) {
        setInterval(() => r.update(), 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      logger.error("Service Worker registration error:", error);
    },
  });
}
