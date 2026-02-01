import type { TFunction } from "i18next";
import type { FileValidationError } from "../types/validation";

/**
 * 格式化单个文件验证错误
 */
export function formatFileValidationError(
  error: FileValidationError,
  t: TFunction,
): string {
  const fileName = error.fileName;

  switch (error.errorType) {
    case "empty":
      return t("error.fileEmpty", { fileName });

    case "size": {
      const maxSizeMB = ((error.maxSize || 0) / 1024 / 1024).toFixed(1);
      const actualSizeMB = ((error.actualSize || 0) / 1024 / 1024).toFixed(1);
      return t("error.fileSizeExceededDetail", {
        fileName,
        actualSize: actualSizeMB,
        maxSize: maxSizeMB,
      });
    }

    case "type": {
      // allowedTypes 已经是扩展名列表（如 [".pdf", ".jpg"]），直接使用
      const allowedExts = (error.allowedTypes || []).join(", ");

      return t("error.fileTypeNotAllowedDetail", {
        fileName,
        allowedTypes: allowedExts,
      });
    }

    case "mismatch": {
      return t("error.fileMismatchDetail", {
        fileName,
        claimedType: error.claimedType || t("common.unknown"),
        detectedType: error.detectedType || t("common.unknown"),
      });
    }

    default:
      return t("error.fileValidationFailed", { fileName });
  }
}

/**
 * 格式化批量文件验证错误
 */
export function formatBatchFileValidationErrors(
  errors: FileValidationError[],
  t: TFunction,
): string {
  if (errors.length === 0) return "";

  if (errors.length === 1) {
    return formatFileValidationError(errors[0], t);
  }

  // 多个错误：显示第一个 + 统计
  const firstError = formatFileValidationError(errors[0], t);
  const remaining = errors.length - 1;

  return `${firstError}\n${t("error.andMoreFiles", { count: remaining })}`;
}
