import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiDownload, FiFile } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { fileService } from "@/features/file/services/fileService";
import { isApiError } from "@/lib/errors";

export interface FilePreviewDialogProps {
  file: {
    download_token: string;
    original_name: string;
    file_size: string | number;
    file_type: string;
  };
}

type PreviewType = "image" | "pdf" | "video" | "text" | "unsupported";

function getPreviewType(mimeType: string): PreviewType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("text/")) return "text";
  return "unsupported";
}

function formatFileSize(size: string | number): string {
  const bytes = Number(size);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilePreviewDialog({ file }: FilePreviewDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  // 用于追踪需要清理的 blob URL
  const blobUrlRef = useRef<string | null>(null);

  const previewType = getPreviewType(file.file_type);

  // 加载预览
  useEffect(() => {
    if (!open || previewType === "unsupported") {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        if (previewType === "text") {
          const content = await fileService.getTextContent(file.download_token);
          if (!cancelled) {
            setTextContent(content);
          }
        } else {
          const url = await fileService.preview(file.download_token);
          if (!cancelled) {
            blobUrlRef.current = url;
            setBlobUrl(url);
          } else {
            // 请求完成但已取消，清理新创建的 URL
            URL.revokeObjectURL(url);
          }
        }
      } catch (e) {
        if (!cancelled) {
          const msg = isApiError(e)
            ? e.message
            : e instanceof Error
              ? e.message
              : t("filePreview.loadFailed");
          setError(msg);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [open, file.download_token, previewType, t]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  // 对话框关闭时清理
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // 清理资源
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setBlobUrl(null);
      setTextContent(null);
      setError(null);
      setLoading(false);
    }
    setOpen(newOpen);
  };

  const handleDownload = () => {
    fileService.download(file.download_token, file.original_name);
  };

  const handleRetry = () => {
    // 触发重新加载
    setError(null);
    setBlobUrl(null);
    setTextContent(null);
    // 通过关闭再打开来触发 effect
    setOpen(false);
    setTimeout(() => setOpen(true), 0);
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <Skeleton className="w-full h-[300px]" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] text-destructive">
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={handleRetry}>
            {t("common.retry")}
          </Button>
        </div>
      );
    }

    switch (previewType) {
      case "image":
        return blobUrl ? (
          <img
            src={blobUrl}
            alt={file.original_name}
            className="max-w-full max-h-[60vh] object-contain mx-auto"
          />
        ) : null;

      case "pdf":
        return blobUrl ? (
          <iframe
            src={blobUrl}
            title={file.original_name}
            className="w-full h-[60vh] border-0"
          />
        ) : null;

      case "video":
        return blobUrl ? (
          <video
            src={blobUrl}
            controls
            className="max-w-full max-h-[60vh] mx-auto"
          >
            <track kind="captions" />
            {t("filePreview.videoNotSupported")}
          </video>
        ) : null;

      case "text":
        return textContent !== null ? (
          <pre className="p-4 bg-muted rounded-lg overflow-auto max-h-[60vh] text-sm whitespace-pre-wrap">
            {textContent}
          </pre>
        ) : null;

      case "unsupported":
        return (
          <div className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground">
            <FiFile className="h-16 w-16 mb-4" />
            <p>{t("filePreview.unsupportedType")}</p>
            <p className="text-sm mt-1">{t("filePreview.downloadToView")}</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors text-left"
        >
          <FiFile className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-sm">{file.original_name}</span>
          <span className="text-xs text-muted-foreground">
            {formatFileSize(file.file_size)}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">
            {file.original_name}
          </DialogTitle>
          <DialogDescription>
            {formatFileSize(file.file_size)} · {file.file_type}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-auto py-4">{renderPreview()}</div>
        <DialogFooter>
          <Button variant="outline" onClick={handleDownload}>
            <FiDownload className="mr-2 h-4 w-4" />
            {t("common.download")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
