/**
 * 文件上传相关类型定义
 */

/** 已上传的文件信息 */
export interface UploadedFile {
  download_token: string;
  name: string;
  size: number;
}

/** 上传任务状态 */
export type UploadTaskStatus =
  | "pending"
  | "uploading"
  | "completed"
  | "cancelled"
  | "error";

/** 上传任务 */
export interface UploadTask {
  file: File;
  progress: number;
  controller: AbortController;
  status: UploadTaskStatus;
}
