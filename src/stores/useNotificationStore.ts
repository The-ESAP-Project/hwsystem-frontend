import { toast } from "sonner";

export type NotificationType = "success" | "error" | "warning" | "info";

const notifyMethods = {
  success: (title: string, message?: string) => {
    toast.success(title, { description: message });
  },
  error: (title: string, message?: string) => {
    toast.error(title, { description: message, duration: 5000 });
  },
  warning: (title: string, message?: string) => {
    toast.warning(title, { description: message, duration: 8000 });
  },
  info: (title: string, message?: string) => {
    toast.info(title, { description: message });
  },
};

/**
 * 通知 Hook - 兼容旧 API
 * 支持 useNotificationStore((s) => s.error) 形式
 */
export function useNotificationStore(): typeof notifyMethods;
export function useNotificationStore<T>(
  selector: (state: typeof notifyMethods) => T,
): T;
export function useNotificationStore<T>(
  selector?: (state: typeof notifyMethods) => T,
): T | typeof notifyMethods {
  if (selector) {
    return selector(notifyMethods);
  }
  return notifyMethods;
}

// 保持 getState 兼容性
useNotificationStore.getState = () => notifyMethods;

// 直接导出便捷方法
export const notify = notifyMethods;
