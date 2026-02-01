import imageCompression from "browser-image-compression";
import { fileTypeFromBuffer } from "file-type";
import { AppConfig } from "@/lib/appConfig";
import { logger } from "@/lib/logger";
import { IMAGE_EXTENSIONS } from "../constants/fileTypes";

export interface CompressionOptions {
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
}

/**
 * 从文件名提取扩展名（小写）
 */
function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex === -1 || lastDotIndex === fileName.length - 1) {
    return "";
  }
  return fileName.slice(lastDotIndex).toLowerCase();
}

/**
 * 判断文件是否为图片（基于扩展名，同步版本）
 */
export function isImageFileByExtension(file: File): boolean {
  const ext = getFileExtension(file.name);
  return IMAGE_EXTENSIONS.includes(ext as (typeof IMAGE_EXTENSIONS)[number]);
}

/**
 * 检测文件实际类型（返回友好名称）
 */
export async function detectFileType(file: File): Promise<string | null> {
  try {
    const buffer = await file.slice(0, 4100).arrayBuffer();
    const type = await fileTypeFromBuffer(buffer);

    if (!type) return null;

    // 返回友好名称，如 "PDF"
    return type.ext.toUpperCase();
  } catch {
    return null;
  }
}

/**
 * 判断文件是否为图片（基于文件头魔数）
 */
export async function isImageFile(file: File): Promise<boolean> {
  try {
    // 读取文件头（前 4100 字节足够判断大多数格式）
    const buffer = await file.slice(0, 4100).arrayBuffer();
    const type = await fileTypeFromBuffer(buffer);

    if (!type) {
      // 无法识别的格式，降级到扩展名判断
      return isImageFileByExtension(file);
    }

    return type.mime.startsWith("image/");
  } catch {
    // 读取失败，降级到扩展名判断
    return isImageFileByExtension(file);
  }
}

/**
 * 判断是否需要压缩
 */
async function shouldCompress(file: File): Promise<boolean> {
  // 1. 检查是否启用压缩
  if (!AppConfig.clientCompressEnabled) {
    return false;
  }

  // 2. 检查是否为图片
  if (!(await isImageFile(file))) {
    return false;
  }

  // 3. 检查文件大小是否超过阈值
  if (file.size < AppConfig.compressThreshold) {
    return false;
  }

  return true;
}

/**
 * 压缩单个图片文件
 *
 * @param file 要压缩的文件
 * @param options 压缩选项
 * @returns 压缩后的文件（压缩失败则返回原文件）
 */
export async function compressImage(
  file: File,
  options?: CompressionOptions,
): Promise<File> {
  // 检查是否需要压缩
  if (!(await shouldCompress(file))) {
    return file;
  }

  try {
    logger.info(
      `[ImageCompression] 开始压缩: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
    );

    const compressedFile = await imageCompression(file, {
      maxSizeMB: Infinity, // 不限制输出大小（由质量参数控制）
      maxWidthOrHeight: Math.max(
        AppConfig.compressMaxWidth,
        AppConfig.compressMaxHeight,
      ),
      useWebWorker: true,
      initialQuality: AppConfig.compressQuality,
      signal: options?.signal,
      onProgress: options?.onProgress,
    });

    // 检查压缩效果
    const originalSize = file.size;
    const compressedSize = compressedFile.size;
    const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);

    logger.info(
      `[ImageCompression] 压缩完成: ${file.name} ` +
        `${(originalSize / 1024).toFixed(1)} KB → ${(compressedSize / 1024).toFixed(1)} KB ` +
        `(减少 ${reduction}%)`,
    );

    // 如果压缩后反而变大了，使用原文件
    if (compressedSize > originalSize) {
      logger.warn(
        `[ImageCompression] 压缩后文件更大，使用原文件: ${file.name}`,
      );
      return file;
    }

    // 保持原文件名
    return new File([compressedFile], file.name, {
      type: compressedFile.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    // 压缩失败时降级为原文件
    if ((error as Error).name === "AbortError") {
      logger.info(`[ImageCompression] 压缩被取消: ${file.name}`);
      throw error; // 取消操作需要向上抛出
    }

    logger.error(
      `[ImageCompression] 压缩失败，使用原文件: ${file.name}`,
      error,
    );
    return file;
  }
}

/**
 * 批量压缩图片（保持非图片文件原样）
 *
 * @param files 要压缩的文件数组
 * @param options 压缩选项
 * @returns 压缩后的文件数组
 */
export async function compressImages(
  files: File[],
  options?: CompressionOptions,
): Promise<File[]> {
  const results = await Promise.all(
    files.map((file) => compressImage(file, options)),
  );
  return results;
}
