import { AppConfig } from "@/lib/appConfig";
import type {
  FileValidationError,
  FileValidationResult,
} from "../types/validation";
import { compressImage } from "./imageCompression";

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
export function validateFile(file: File): FileValidationError | null {
  const maxSize = AppConfig.maxFileSize;
  const allowedExtensions = AppConfig.allowedFileTypes;

  // 1. 检查空文件
  if (file.size === 0) {
    return {
      fileName: file.name,
      errorType: "empty",
    };
  }

  // 2. 检查文件大小
  if (file.size > maxSize) {
    return {
      fileName: file.name,
      errorType: "size",
      maxSize,
      actualSize: file.size,
    };
  }

  // 3. 检查文件扩展名
  // allowedExtensions 为空数组时表示允许所有类型
  if (allowedExtensions.length > 0) {
    const extension = getFileExtension(file.name);

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
 * @deprecated 请使用 validateFilesWithCompression 以支持压缩后大小验证
 */
export function validateFiles(files: File[]): FileValidationResult {
  const errors: FileValidationError[] = [];

  for (const file of files) {
    const error = validateFile(file);
    if (error) {
      errors.push(error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 验证单个文件（压缩后）
 * 对于图片文件，先压缩再验证大小
 */
export async function validateFileWithCompression(
  file: File,
): Promise<{ error: FileValidationError | null; processedFile: File }> {
  const maxSize = AppConfig.maxFileSize;
  const allowedExtensions = AppConfig.allowedFileTypes;

  // 1. 检查空文件
  if (file.size === 0) {
    return {
      error: {
        fileName: file.name,
        errorType: "empty",
      },
      processedFile: file,
    };
  }

  // 2. 检查文件扩展名（在压缩前检查，避免不必要的压缩）
  if (allowedExtensions.length > 0) {
    const extension = getFileExtension(file.name);
    const isAllowed = allowedExtensions.some(
      (allowed) => allowed.toLowerCase() === extension,
    );

    if (!isAllowed) {
      return {
        error: {
          fileName: file.name,
          errorType: "type",
          allowedTypes: allowedExtensions,
          actualType: extension || "(无扩展名)",
        },
        processedFile: file,
      };
    }
  }

  // 3. 尝试压缩图片（如果是图片且启用了压缩）
  let processedFile = file;
  try {
    processedFile = await compressImage(file);
  } catch {
    // 压缩失败，使用原文件继续验证
    processedFile = file;
  }

  // 4. 检查文件大小（使用压缩后的大小）
  if (processedFile.size > maxSize) {
    return {
      error: {
        fileName: file.name,
        errorType: "size",
        maxSize,
        actualSize: processedFile.size,
      },
      processedFile,
    };
  }

  return { error: null, processedFile };
}

/**
 * 验证多个文件（批量上传场景，支持压缩后大小验证）
 * 对于图片文件，会先压缩再验证大小
 *
 * @returns 验证结果和处理后的文件列表
 */
export async function validateFilesWithCompression(
  files: File[],
): Promise<FileValidationResult & { processedFiles: File[] }> {
  const errors: FileValidationError[] = [];
  const processedFiles: File[] = [];

  for (const file of files) {
    const { error, processedFile } = await validateFileWithCompression(file);
    if (error) {
      errors.push(error);
    }
    processedFiles.push(processedFile);
  }

  return {
    valid: errors.length === 0,
    errors,
    processedFiles,
  };
}
