import api from "@/lib/api";
import type { Stringify } from "@/types";
import type { FileUploadResponse } from "@/types/generated";

// 直接使用生成的类型
export type FileUploadResult = Stringify<FileUploadResponse>;

export const fileService = {
  // 上传文件
  upload: async (file: File): Promise<FileUploadResult> => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post<{ data: FileUploadResponse }>(
      "/files/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return data.data as unknown as FileUploadResult;
  },

  // 获取下载 URL（仅用于构建 URL，不直接用于下载）
  getDownloadUrl: (token: string) => {
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";
    return `${baseUrl}/files/download/${token}`;
  },

  // 下载文件（使用 fetch + blob，携带 JWT 认证）
  download: async (token: string, fileName?: string) => {
    const authToken = localStorage.getItem("authToken");
    const url = fileService.getDownloadUrl(token);

    const response = await fetch(url, {
      headers: {
        Authorization: authToken ? `Bearer ${authToken}` : "",
      },
    });

    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`);
    }

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
    const authToken = localStorage.getItem("authToken");
    const url = fileService.getDownloadUrl(token);

    const response = await fetch(url, {
      headers: {
        Authorization: authToken ? `Bearer ${authToken}` : "",
      },
    });

    if (!response.ok) {
      throw new Error(`获取文件失败: ${response.status}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },

  // 获取文本文件内容
  getTextContent: async (token: string): Promise<string> => {
    const authToken = localStorage.getItem("authToken");
    const url = fileService.getDownloadUrl(token);

    const response = await fetch(url, {
      headers: {
        Authorization: authToken ? `Bearer ${authToken}` : "",
      },
    });

    if (!response.ok) {
      throw new Error(`获取文件失败: ${response.status}`);
    }

    return response.text();
  },
};
