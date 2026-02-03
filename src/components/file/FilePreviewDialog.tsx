import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFile,
} from "react-icons/fi";
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
import { PdfViewer } from "./PdfViewer";
import { ThumbnailImage } from "./ThumbnailImage";

interface FileInfo {
  download_token: string;
  original_name: string;
  file_size: string | number;
  file_type: string;
}

export interface FilePreviewDialogProps {
  file: FileInfo;
  files?: FileInfo[];
  initialIndex?: number;
  showThumbnail?: boolean;
}

type PreviewType = "image" | "pdf" | "video" | "text" | "unsupported";

function getPreviewType(mimeType: string): PreviewType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("text/")) return "text";
  return "unsupported";
}

function isImageType(mimeType: string): boolean {
  return mimeType.startsWith("image/") && !mimeType.includes("svg");
}

function formatFileSize(size: string | number): string {
  const bytes = Number(size);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilePreviewDialog({
  file,
  files,
  initialIndex = 0,
  showThumbnail = false,
}: FilePreviewDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // 用于追踪需要清理的 blob URL
  const blobUrlRef = useRef<string | null>(null);

  // 多文件导航模式
  const hasNavigation = files && files.length > 1;
  const currentFile = useMemo(() => {
    if (hasNavigation && files) {
      return files[currentIndex] ?? file;
    }
    return file;
  }, [hasNavigation, files, currentIndex, file]);

  const hasPrev = hasNavigation && currentIndex > 0;
  const hasNext = hasNavigation && files && currentIndex < files.length - 1;

  const previewType = getPreviewType(currentFile.file_type);

  // 清理当前 blob URL
  const cleanupBlobUrl = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setBlobUrl(null);
    setTextContent(null);
  }, []);

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
          const content = await fileService.getTextContent(
            currentFile.download_token,
          );
          if (!cancelled) {
            setTextContent(content);
          }
        } else {
          const url = await fileService.preview(currentFile.download_token);
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
  }, [open, currentFile.download_token, previewType, t]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  // 切换文件时清理旧资源
  const navigateTo = useCallback(
    (index: number) => {
      cleanupBlobUrl();
      setError(null);
      setCurrentIndex(index);
    },
    [cleanupBlobUrl],
  );

  const goToPrev = useCallback(() => {
    if (hasPrev) {
      navigateTo(currentIndex - 1);
    }
  }, [hasPrev, currentIndex, navigateTo]);

  const goToNext = useCallback(() => {
    if (hasNext) {
      navigateTo(currentIndex + 1);
    }
  }, [hasNext, currentIndex, navigateTo]);

  // 键盘快捷键
  useEffect(() => {
    if (!open || !hasNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        goToPrev();
      }
      if (e.key === "ArrowRight" && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, hasNavigation, goToPrev, goToNext]);

  // 对话框关闭时清理
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      cleanupBlobUrl();
      setError(null);
      setLoading(false);
      setCurrentIndex(initialIndex);
    }
    setOpen(newOpen);
  };

  const handleDownload = () => {
    fileService.download(currentFile.download_token, currentFile.original_name);
  };

  const handleRetry = () => {
    setError(null);
    cleanupBlobUrl();
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
            alt={currentFile.original_name}
            className="max-w-full max-h-[60vh] object-contain mx-auto"
          />
        ) : null;

      case "pdf":
        return blobUrl ? <PdfViewer url={blobUrl} /> : null;

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

  // 截断文件名显示
  const truncateFileName = (name: string, maxLength = 20) => {
    if (name.length <= maxLength) return name;
    const ext = name.lastIndexOf(".");
    if (ext > 0 && name.length - ext <= 6) {
      // 保留扩展名
      const extPart = name.slice(ext);
      const namePart = name.slice(0, maxLength - extPart.length - 3);
      return `${namePart}...${extPart}`;
    }
    return `${name.slice(0, maxLength - 3)}...`;
  };

  // 渲染触发器：图片缩略图模式 vs 普通列表模式
  const renderTrigger = () => {
    const isImage = showThumbnail && isImageType(file.file_type);

    if (isImage) {
      // 图片卡片样式
      return (
        <button
          type="button"
          className="group relative overflow-hidden rounded-lg border bg-muted/30 hover:bg-accent transition-all hover:shadow-md"
        >
          <div className="aspect-square w-full">
            <ThumbnailImage
              token={file.download_token}
              alt={file.original_name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <p className="text-xs text-white truncate font-medium">
              {truncateFileName(file.original_name)}
            </p>
            <p className="text-xs text-white/70">
              {formatFileSize(file.file_size)}
            </p>
          </div>
        </button>
      );
    }

    // 普通列表样式
    return (
      <button
        type="button"
        className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors text-left"
      >
        <FiFile className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate">{file.original_name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.file_size)}
          </p>
        </div>
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{renderTrigger()}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">
            {currentFile.original_name}
          </DialogTitle>
          <DialogDescription>
            {formatFileSize(currentFile.file_size)} · {currentFile.file_type}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-auto py-4">{renderPreview()}</div>
        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          {hasNavigation && files ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrev}
                disabled={!hasPrev}
              >
                <FiChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                {currentIndex + 1} / {files.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                disabled={!hasNext}
              >
                <FiChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div />
          )}
          <Button variant="outline" onClick={handleDownload}>
            <FiDownload className="mr-2 h-4 w-4" />
            {t("common.download")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
