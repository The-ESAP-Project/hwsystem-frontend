import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiCheckCircle,
  FiDownload,
  FiLoader,
  FiUpload,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { validateFile } from "@/features/file/services/fileValidation";
import { formatFileValidationError } from "@/features/file/utils/formatFileError";
import { cn } from "@/lib/utils";
import { notify } from "@/stores/useNotificationStore";
import {
  type UserImportResponseStringified,
  useDownloadImportTemplate,
  useImportUsers,
} from "../hooks/useUsers";

interface UserImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserImportDialog({
  open,
  onOpenChange,
}: UserImportDialogProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] =
    useState<UserImportResponseStringified | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const importMutation = useImportUsers();
  const downloadTemplateMutation = useDownloadImportTemplate();

  const handleFileSelect = useCallback(
    async (file: File | null) => {
      if (file) {
        setIsValidating(true);
        try {
          // 1. CSV/XLSX 类型检查（保留现有逻辑）
          const validTypes = [
            "text/csv",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
          ];
          const isValidType =
            validTypes.includes(file.type) ||
            file.name.endsWith(".csv") ||
            file.name.endsWith(".xlsx");

          if (!isValidType) {
            notify.error(
              t("error.fileTypeNotAllowed"),
              t("admin.users.import.supportedFormats"),
            );
            return;
          }

          // 2. 文件大小和空文件验证（新增）
          const validationError = await validateFile(file);
          if (validationError) {
            const errorMessage = formatFileValidationError(validationError, t);
            notify.error(
              validationError.errorType === "size"
                ? t("error.fileSizeExceeded")
                : t("error.fileValidationFailed"),
              errorMessage,
            );
            return;
          }
        } finally {
          setIsValidating(false);
        }
      }
      setSelectedFile(file);
      setImportResult(null);
    },
    [t],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleImport = async () => {
    if (!selectedFile) return;
    const result = await importMutation.mutateAsync(selectedFile);
    setImportResult(result);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImportResult(null);
    onOpenChange(false);
  };

  const handleDownloadTemplate = (format: "csv" | "xlsx") => {
    downloadTemplateMutation.mutate(format);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("admin.users.import.title", "导入用户")}</DialogTitle>
          <DialogDescription>
            {t(
              "admin.users.import.description",
              "上传 CSV 或 XLSX 文件批量创建用户",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 模板下载 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t("admin.users.import.downloadTemplate", "下载模板：")}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadTemplate("csv")}
              disabled={downloadTemplateMutation.isPending}
            >
              <FiDownload className="mr-1 h-4 w-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadTemplate("xlsx")}
              disabled={downloadTemplateMutation.isPending}
            >
              <FiDownload className="mr-1 h-4 w-4" />
              XLSX
            </Button>
          </div>

          {/* 文件上传区域 */}
          <div
            role="button"
            tabIndex={0}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50",
              selectedFile &&
                "border-green-500 bg-green-50 dark:bg-green-900/20",
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            />
            {isValidating ? (
              <div className="space-y-2">
                <FiLoader className="mx-auto h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">
                  {t("common.validatingFiles")}
                </p>
              </div>
            ) : selectedFile ? (
              <div className="space-y-2">
                <FiCheckCircle className="mx-auto h-8 w-8 text-green-500" />
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <FiUpload className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {t(
                    "admin.users.import.dropzone",
                    "拖拽文件到此处，或点击选择文件",
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "admin.users.import.supportedFormats",
                    "支持 CSV、XLSX 格式",
                  )}
                </p>
              </div>
            )}
          </div>

          {/* 导入结果 */}
          {importResult && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">
                    {t("admin.users.import.total", "总计")}:
                  </span>
                  <span className="font-medium">{importResult.total}</span>
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <FiCheckCircle className="h-4 w-4" />
                  <span>
                    {t("admin.users.import.success", "成功")}:{" "}
                    {importResult.success}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-yellow-600">
                  <FiAlertTriangle className="h-4 w-4" />
                  <span>
                    {t("admin.users.import.skipped", "跳过")}:{" "}
                    {importResult.skipped}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-red-600">
                  <FiAlertCircle className="h-4 w-4" />
                  <span>
                    {t("admin.users.import.failed", "失败")}:{" "}
                    {importResult.failed}
                  </span>
                </div>
              </div>

              {/* 错误详情 */}
              {importResult.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {importResult.errors.slice(0, 10).map((error, index) => (
                    <div
                      key={index}
                      className="text-sm text-red-600 flex items-start gap-2"
                    >
                      <span className="shrink-0">
                        {t("admin.users.import.row", "第 {{row}} 行", {
                          row: error.row,
                        })}
                        :
                      </span>
                      <span>
                        {error.field && `[${error.field}] `}
                        {error.message}
                      </span>
                    </div>
                  ))}
                  {importResult.errors.length > 10 && (
                    <p className="text-sm text-muted-foreground">
                      {t(
                        "admin.users.import.moreErrors",
                        "还有 {{count}} 个错误...",
                        {
                          count: importResult.errors.length - 10,
                        },
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {importResult
              ? t("common.close", "关闭")
              : t("common.cancel", "取消")}
          </Button>
          {!importResult && (
            <Button
              onClick={handleImport}
              disabled={!selectedFile || importMutation.isPending}
            >
              {importMutation.isPending
                ? t("admin.users.import.importing", "导入中...")
                : t("admin.users.import.import", "开始导入")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
