import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useApiError } from "@/hooks/useApiError";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { type FileUploadResult, fileService } from "../services/fileService";

// 上传文件
export function useUploadFile() {
  const { t } = useTranslation();
  const { handleError } = useApiError();

  return useMutation({
    mutationFn: (file: File): Promise<FileUploadResult> =>
      fileService.upload(file),
    onError: (err) => {
      handleError(err, { title: t("notify.file.uploadFailed") });
    },
  });
}

// 删除文件
export function useDeleteFile() {
  const { t } = useTranslation();
  const success = useNotificationStore((s) => s.success);
  const { handleError } = useApiError();

  return useMutation({
    mutationFn: (token: string) => fileService.delete(token),
    onSuccess: () => {
      success(t("notify.file.deleteSuccess"), t("notify.file.deleted"));
    },
    onError: (err) => {
      handleError(err, { title: t("notify.file.deleteFailed") });
    },
  });
}

// 下载文件
export function useDownloadFile() {
  const { t } = useTranslation();
  const { handleError } = useApiError();

  return useMutation({
    mutationFn: ({ token, fileName }: { token: string; fileName?: string }) =>
      fileService.download(token, fileName),
    onError: (err) => {
      handleError(err, { title: t("notify.file.downloadFailed") });
    },
  });
}

// 预览文件（返回 blob URL）
export function usePreviewFile() {
  const { t } = useTranslation();
  const { handleError } = useApiError();

  return useMutation({
    mutationFn: (token: string) => fileService.preview(token),
    onError: (err) => {
      handleError(err, { title: t("notify.file.previewFailed") });
    },
  });
}
