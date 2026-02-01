import imageCompression from "browser-image-compression";
import { Download, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CompressionParams {
  quality: string;
  maxWidth: string;
  maxHeight: string;
}

interface ImageCompressionTesterProps {
  onApplySettings: (params: CompressionParams) => void;
}

export function ImageCompressionTester({
  onApplySettings,
}: ImageCompressionTesterProps) {
  const { t } = useTranslation();
  const abortControllerRef = useRef<AbortController | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(0.85);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [maxHeight, setMaxHeight] = useState(1920);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [compressionTime, setCompressionTime] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [originalPreview, setOriginalPreview] = useState<string>("");
  const [compressedPreview, setCompressedPreview] = useState<string>("");

  // biome-ignore lint/correctness/useExhaustiveDependencies: compressedPreview intentionally omitted to prevent infinite loop
  const compressTestImage = useCallback(async () => {
    if (!file) return;

    // 取消之前的压缩任务
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsCompressing(true);
    const startTime = performance.now();

    try {
      // 检查是否被取消
      if (signal.aborted) return;

      const compressed = await imageCompression(file, {
        maxWidthOrHeight: Math.max(maxWidth, maxHeight),
        useWebWorker: true,
        initialQuality: quality,
        signal,
      });

      // 再次检查是否被取消
      if (signal.aborted) return;

      setCompressionTime(performance.now() - startTime);
      setCompressedFile(compressed);

      // 生成预览
      if (compressedPreview) URL.revokeObjectURL(compressedPreview);
      setCompressedPreview(URL.createObjectURL(compressed));
    } catch (error) {
      // 忽略取消错误
      if ((error as Error).name === "AbortError") return;
      toast.error(
        `${t("systemSettings.compression.compressing")} ${(error as Error).message}`,
      );
    } finally {
      if (!signal.aborted) {
        setIsCompressing(false);
      }
    }
  }, [file, quality, maxWidth, maxHeight, t]);

  // 当参数或文件变化时，自动重新压缩（带防抖）
  useEffect(() => {
    if (!file) return;

    const timer = setTimeout(() => {
      compressTestImage();
    }, 500); // 500ms 防抖

    return () => clearTimeout(timer);
  }, [file, compressTestImage]);

  // 清理预览 URL
  useEffect(() => {
    return () => {
      if (originalPreview) URL.revokeObjectURL(originalPreview);
      if (compressedPreview) URL.revokeObjectURL(compressedPreview);
    };
  }, [originalPreview, compressedPreview]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      toast.error(t("systemSettings.compression.errorNotImage"));
      return;
    }

    setFile(selectedFile);
    setOriginalPreview(URL.createObjectURL(selectedFile));
    setCompressedFile(null);
    setCompressedPreview("");
  };

  const handleApplySettings = () => {
    if (!file) {
      toast.error(t("systemSettings.compression.errorNoFile"));
      return;
    }

    onApplySettings({
      quality: quality.toString(),
      maxWidth: maxWidth.toString(),
      maxHeight: maxHeight.toString(),
    });
    toast.success(t("systemSettings.compression.successApplied"));
  };

  const handleDownload = () => {
    if (!compressedFile) return;

    const url = URL.createObjectURL(compressedFile);
    const link = document.createElement("a");
    link.href = url;
    link.download = `compressed_${file?.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setFile(null);
    setCompressedFile(null);
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    if (compressedPreview) URL.revokeObjectURL(compressedPreview);
    setOriginalPreview("");
    setCompressedPreview("");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const compressionRate =
    file && compressedFile
      ? ((1 - compressedFile.size / file.size) * 100).toFixed(1)
      : "0";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Upload className="h-5 w-5" />
          {t("systemSettings.compression.title")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("systemSettings.compression.description")}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 上传区域 */}
        <div>
          <Label htmlFor="test-image">
            {t("systemSettings.compression.selectImage")}
          </Label>
          <div className="mt-2 flex items-center gap-2">
            <Input
              id="test-image"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="flex-1"
            />
            {file && (
              <Button variant="ghost" size="icon" onClick={handleClear}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {file && (
            <p className="mt-1 text-sm text-muted-foreground">{file.name}</p>
          )}
        </div>

        {/* 参数调整区域 */}
        <div className="space-y-4">
          {/* 压缩质量 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("systemSettings.compression.quality")}</Label>
              <Input
                type="number"
                min="0.1"
                max="1"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-20 h-8 text-sm"
              />
            </div>
            <input
              type="range"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              min={0.1}
              max={1}
              step={0.05}
              className="w-full"
              aria-label={t("systemSettings.compression.quality")}
            />
            <p className="text-xs text-muted-foreground">
              {t("systemSettings.compression.qualityHint", {
                percent: (quality * 100).toFixed(0),
              })}
            </p>
          </div>

          {/* 最大宽度 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("systemSettings.compression.maxWidth")}</Label>
              <Input
                type="number"
                min="500"
                max="4000"
                step="100"
                value={maxWidth}
                onChange={(e) => setMaxWidth(parseInt(e.target.value, 10))}
                className="w-24 h-8 text-sm"
              />
            </div>
            <input
              type="range"
              value={maxWidth}
              onChange={(e) => setMaxWidth(parseInt(e.target.value, 10))}
              min={500}
              max={4000}
              step={100}
              className="w-full"
              aria-label={t("systemSettings.compression.maxWidth")}
            />
          </div>

          {/* 最大高度 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("systemSettings.compression.maxHeight")}</Label>
              <Input
                type="number"
                min="500"
                max="4000"
                step="100"
                value={maxHeight}
                onChange={(e) => setMaxHeight(parseInt(e.target.value, 10))}
                className="w-24 h-8 text-sm"
              />
            </div>
            <input
              type="range"
              value={maxHeight}
              onChange={(e) => setMaxHeight(parseInt(e.target.value, 10))}
              min={500}
              max={4000}
              step={100}
              className="w-full"
              aria-label={t("systemSettings.compression.maxHeight")}
            />
          </div>
        </div>

        {/* 对比区域 */}
        {file && (
          <div className="grid grid-cols-2 gap-4 border rounded-lg p-4">
            {/* 原图 */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">
                {t("systemSettings.compression.original")}
              </h4>
              {originalPreview && (
                <img
                  src={originalPreview}
                  alt={t("systemSettings.compression.original")}
                  className="w-full h-48 object-contain border rounded bg-muted"
                />
              )}
              <div className="text-sm space-y-1">
                <p className="text-muted-foreground">
                  {t("systemSettings.compression.size")}{" "}
                  <span className="font-medium text-foreground">
                    {formatFileSize(file.size)}
                  </span>
                </p>
              </div>
            </div>

            {/* 压缩后 */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">
                {t("systemSettings.compression.compressed")}
              </h4>
              {isCompressing ? (
                <div className="w-full h-48 flex items-center justify-center border rounded bg-muted">
                  <p className="text-sm text-muted-foreground">
                    {t("systemSettings.compression.compressing")}
                  </p>
                </div>
              ) : compressedPreview ? (
                <img
                  src={compressedPreview}
                  alt={t("systemSettings.compression.compressed")}
                  className="w-full h-48 object-contain border rounded bg-muted"
                />
              ) : (
                <div className="w-full h-48 flex items-center justify-center border rounded bg-muted">
                  <p className="text-sm text-muted-foreground">
                    {t("systemSettings.compression.waiting")}
                  </p>
                </div>
              )}
              {compressedFile && (
                <div className="text-sm space-y-1">
                  <p className="text-muted-foreground">
                    {t("systemSettings.compression.size")}{" "}
                    <span className="font-medium text-foreground">
                      {formatFileSize(compressedFile.size)}
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    {t("systemSettings.compression.reduced")}{" "}
                    <span className="font-medium text-green-600">
                      {compressionRate}%
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    {t("systemSettings.compression.time")}{" "}
                    <span className="font-medium text-foreground">
                      {compressionTime.toFixed(0)} ms
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button onClick={handleApplySettings} disabled={!file}>
            {t("systemSettings.compression.apply")}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={!compressedFile}
          >
            <Download className="h-4 w-4 mr-2" />
            {t("systemSettings.compression.download")}
          </Button>
          <Button variant="ghost" onClick={handleClear} disabled={!file}>
            {t("systemSettings.compression.clear")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
