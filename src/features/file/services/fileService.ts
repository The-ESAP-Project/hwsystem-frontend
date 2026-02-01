import api from "@/lib/api";
import { AppConfig } from "@/lib/appConfig";
import { getApiBaseUrl } from "@/lib/config";
import { useUserStore } from "@/stores/useUserStore";
import type { FileUploadResponse } from "@/types/generated";
import { compressImage } from "./imageCompression";

// 直接使用生成的类型
export type FileUploadResult = FileUploadResponse;

// 上传选项
export interface UploadOptions {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

// 从内存 store 获取 token
const getAuthToken = () => useUserStore.getState().accessToken;

/**
 * 带超时的 fetch 封装
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = AppConfig.fileOperationTimeout,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 获取文件内容（带认证）
 */
async function fetchFileContent(token: string): Promise<Response> {
  const authToken = getAuthToken();
  const url = `${getApiBaseUrl()}/files/download/${token}`;

  const response = await fetchWithTimeout(url, {
    headers: {
      Authorization: authToken ? `Bearer ${authToken}` : "",
    },
  });

  if (!response.ok) {
    throw new Error(`获取文件失败: ${response.status}`);
  }

  return response;
}

export const fileService = {
  // 上传文件
  upload: async (
    file: File,
    options?: UploadOptions,
  ): Promise<FileUploadResult> => {
    // 上传前尝试压缩图片
    let fileToUpload: File;
    try {
      fileToUpload = await compressImage(file, {
        signal: options?.signal,
        // 注意：压缩进度不传递给 onProgress，因为会和上传进度混淆
      });
    } catch (error) {
      // 如果压缩被取消，直接抛出
      if ((error as Error).name === "AbortError") {
        throw error;
      }
      // 其他错误：使用原文件继续上传
      fileToUpload = file;
    }

    // 压缩后验证大小（图片文件在初始验证时跳过了大小检查）
    const maxSize = AppConfig.maxFileSize;
    if (fileToUpload.size > maxSize) {
      const sizeMB = (maxSize / 1024 / 1024).toFixed(1);
      throw new Error(`文件 "${file.name}" 压缩后仍超过大小限制 (${sizeMB}MB)`);
    }

    const formData = new FormData();
    formData.append("file", fileToUpload);

    const { data } = await api.post<{ data: FileUploadResponse }>(
      "/files/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: AppConfig.fileOperationTimeout,
        signal: options?.signal,
        onUploadProgress: (progressEvent) => {
          if (options?.onProgress && progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            options.onProgress(percent);
          }
        },
      },
    );
    return data.data;
  },

  // 获取下载 URL（仅用于构建 URL，不直接用于下载）
  getDownloadUrl: (token: string) => {
    return `${getApiBaseUrl()}/files/download/${token}`;
  },

  // 下载文件（使用 fetch + blob，携带 JWT 认证）
  download: async (token: string, fileName?: string) => {
    const response = await fetchFileContent(token);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    // 创建临时链接并触发下载
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 释放 blob URL
    URL.revokeObjectURL(blobUrl);
  },

  // 删除文件
  delete: async (token: string) => {
    await api.delete(`/files/${token}`);
  },

  // 预览文件 - 返回 blob URL（用于图片/PDF/视频）
  preview: async (token: string): Promise<string> => {
    const response = await fetchFileContent(token);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },

  // 获取文本文件内容
  getTextContent: async (token: string): Promise<string> => {
    const response = await fetchFileContent(token);
    return response.text();
  },
};
