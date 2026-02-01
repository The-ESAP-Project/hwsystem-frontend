import { AppConfig } from "@/lib/appConfig";
import { isImageExtension } from "../constants/fileTypes";
import type {
  FileValidationError,
  FileValidationResult,
} from "../types/validation";
import { detectFileType, isImageFile } from "./imageCompression";

/**
 * 从文件名提取扩展名（带点号，小写）
 * 例如: "document.PDF" -> ".pdf"
 */
function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex === -1 || lastDotIndex === fileName.length - 1) {
    return "";
  }
  return `.${fileName.slice(lastDotIndex + 1).toLowerCase()}`;
}

/**
 * 验证单个文件
 *
 * 验证规则与后端保持一致：
 * - 检查文件扩展名（不是 MIME type）
 * - allowedFileTypes 存储的是扩展名列表，如 [".pdf", ".jpg", ".docx"]
 */
export async function validateFile(
  file: File,
): Promise<FileValidationError | null> {
  const maxSize = AppConfig.maxFileSize;
  const allowedExtensions = AppConfig.allowedFileTypes;

  // 1. 检查空文件
  if (file.size === 0) {
    return {
      fileName: file.name,
      errorType: "empty",
    };
  }

  // 2. 检查扩展名与实际文件类型是否匹配（防止伪装）
  const extension = getFileExtension(file.name);
  const claimsToBeImage = isImageExtension(extension);
  const isActuallyImage = await isImageFile(file);

  if (claimsToBeImage && !isActuallyImage) {
    // 声称是图片但实际不是 → 拦截
    const detectedType = await detectFileType(file);
    return {
      fileName: file.name,
      errorType: "mismatch",
      claimedType: extension,
      detectedType: detectedType || undefined,
    };
  }

  // 3. 检查文件大小（图片文件跳过，压缩后再检查）
  if (!isActuallyImage && file.size > maxSize) {
    return {
      fileName: file.name,
      errorType: "size",
      maxSize,
      actualSize: file.size,
    };
  }

  // 4. 检查文件扩展名
  // allowedExtensions 为空数组时表示允许所有类型
  if (allowedExtensions.length > 0) {
    // 检查扩展名是否在允许列表中（不区分大小写）
    const isAllowed = allowedExtensions.some(
      (allowed) => allowed.toLowerCase() === extension,
    );

    if (!isAllowed) {
      return {
        fileName: file.name,
        errorType: "type",
        allowedTypes: allowedExtensions,
        actualType: extension || "(无扩展名)",
      };
    }
  }

  return null;
}

/**
 * 验证多个文件（批量上传场景）
 */
export async function validateFiles(
  files: File[],
): Promise<FileValidationResult> {
  const errors: FileValidationError[] = [];

  for (const file of files) {
    const error = await validateFile(file);
    if (error) {
      errors.push(error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
