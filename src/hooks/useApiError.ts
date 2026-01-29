import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getErrorMessage, isApiError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { useNotificationStore } from "@/stores/useNotificationStore";

export interface UseApiErrorOptions {
  /** 是否静默处理（不显示通知） */
  silent?: boolean;
  /** 自定义错误标题 */
  title?: string;
}

/**
 * 统一 API 错误处理 Hook
 * 自动处理 ApiError、普通 Error 和未知错误
 */
export function useApiError() {
  const { t } = useTranslation();
  const { error: showError } = useNotificationStore();

  const handleError = useCallback(
    (error: unknown, options: UseApiErrorOptions = {}) => {
      const { silent = false, title } = options;

      // 提取错误信息
      let message: string;

      if (isApiError(error)) {
        // ApiError: 使用错误码映射
        message = getErrorMessage(error.code, error.message);
      } else if (error instanceof Error) {
        // 普通 Error
        message = error.message;
      } else if (typeof error === "string") {
        // 字符串错误
        message = error;
      } else {
        // 未知错误
        message = t("common.unknownError", "发生未知错误，请稍后重试");
      }

      // 显示通知（除非静默）
      if (!silent) {
        showError(title || t("common.operationFailed", "操作失败"), message);
      }

      // 在开发环境输出详细错误
      if (import.meta.env.DEV) {
        logger.debug("[useApiError]", error);
      }

      return message;
    },
    [t, showError],
  );

  /**
   * 包装异步函数，自动处理错误
   */
  const withErrorHandling = useCallback(
    <T>(
      asyncFn: () => Promise<T>,
      options: UseApiErrorOptions = {},
    ): Promise<T | undefined> => {
      return asyncFn().catch((error) => {
        handleError(error, options);
        return undefined;
      });
    },
    [handleError],
  );

  return {
    handleError,
    withErrorHandling,
  };
}

export default useApiError;
