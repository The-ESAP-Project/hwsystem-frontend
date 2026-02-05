import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiArrowLeft,
  FiAward,
  FiChevronDown,
  FiClock,
  FiFile,
  FiLoader,
  FiUpload,
  FiX,
} from "react-icons/fi";
import { Link, useNavigate, useParams } from "react-router";
import { z } from "zod";
import { FilePreviewDialog } from "@/components/file/FilePreviewDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useRoutePrefix } from "@/features/class/hooks/useClassBasePath";
import { fileService } from "@/features/file/services/fileService";
import { validateFiles } from "@/features/file/services/fileValidation";
import type { UploadedFile, UploadTask } from "@/features/file/types/upload";
import { formatBatchFileValidationErrors } from "@/features/file/utils/formatFileError";
import { useHomework } from "@/features/homework/hooks/useHomework";
import { MAX_CONCURRENT_UPLOADS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { notify } from "@/stores/useNotificationStore";
import {
  useCreateSubmission,
  useMyLatestSubmission,
} from "../hooks/useSubmission";

function useFormSchema() {
  const { t } = useTranslation();
  return useMemo(
    () =>
      z.object({
        content: z
          .string()
          .max(10000, t("validation.maxLength", { max: 10000 }))
          .optional(),
      }),
    [t],
  );
}

type FormValues = z.infer<ReturnType<typeof useFormSchema>>;

export function SubmitHomeworkPage() {
  const { t } = useTranslation();
  const formSchema = useFormSchema();
  const { classId, homeworkId } = useParams<{
    classId: string;
    homeworkId: string;
  }>();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { data: homework, isLoading: homeworkLoading } = useHomework(
    homeworkId!,
  );
  const { data: latestSubmission } = useMyLatestSubmission(homeworkId!);
  const createSubmission = useCreateSubmission(homeworkId!);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadTasks, setUploadTasks] = useState<Map<string, UploadTask>>(
    new Map(),
  );
  const [isValidating, setIsValidating] = useState(false);

  // 取消单个上传
  const handleCancelUpload = (fileName: string) => {
    const task = uploadTasks.get(fileName);
    if (task) {
      task.controller.abort();
      setUploadTasks((prev) => {
        const next = new Map(prev);
        next.set(fileName, { ...task, status: "cancelled" });
        setTimeout(() => {
          setUploadTasks((p) => {
            const n = new Map(p);
            n.delete(fileName);
            return n;
          });
        }, 1000);
        return next;
      });
    }
  };

  const isDeadlinePassed = homework?.deadline
    ? new Date(homework.deadline) < new Date()
    : false;
  const isLateSubmission = isDeadlinePassed && homework?.allow_late;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 显示验证中状态
    setIsValidating(true);

    try {
      // 客户端验证
      const validationResult = await validateFiles(Array.from(files));

      if (!validationResult.valid) {
        const errorMessage = formatBatchFileValidationErrors(
          validationResult.errors,
          t,
        );
        notify.error(t("error.fileValidationFailed"), errorMessage);
        e.target.value = "";
        return;
      }

      const fileList = Array.from(files);

      // 创建所有任务
      const newTasks = new Map<string, UploadTask>();
      for (const file of fileList) {
        newTasks.set(file.name, {
          file,
          progress: 0,
          controller: new AbortController(),
          status: "pending",
        });
      }
      setUploadTasks((prev) => new Map([...prev, ...newTasks]));

      // 上传单个文件
      const uploadOne = async (file: File) => {
        const task = newTasks.get(file.name)!;

        setUploadTasks((prev) => {
          const next = new Map(prev);
          next.set(file.name, { ...task, status: "uploading" });
          return next;
        });

        try {
          const result = await fileService.upload(file, {
            signal: task.controller.signal,
            onProgress: (percent) => {
              setUploadTasks((prev) => {
                const next = new Map(prev);
                const current = next.get(file.name);
                if (current) {
                  next.set(file.name, { ...current, progress: percent });
                }
                return next;
              });
            },
          });

          setUploadedFiles((prev) => [
            ...prev,
            {
              download_token: result.download_token,
              name: result.file_name,
              size: Number(result.size),
            },
          ]);

          setUploadTasks((prev) => {
            const next = new Map(prev);
            next.delete(file.name);
            return next;
          });
        } catch (error) {
          // 用户取消，不显示错误
          if (axios.isCancel(error)) {
            return;
          }
          logger.error("Failed to upload file", error);
          notify.error(t("notify.file.uploadFailed"));

          setUploadTasks((prev) => {
            const next = new Map(prev);
            next.set(file.name, { ...task, status: "error" });
            setTimeout(() => {
              setUploadTasks((p) => {
                const n = new Map(p);
                n.delete(file.name);
                return n;
              });
            }, 2000);
            return next;
          });
        }
      };

      // 并行上传（限制并发数）
      const pool: Promise<void>[] = [];
      for (const file of fileList) {
        const promise = uploadOne(file);
        pool.push(promise);

        if (pool.length >= MAX_CONCURRENT_UPLOADS) {
          await Promise.race(pool);
          // 移除已完成的 Promise
          const completedIndex = await Promise.race(
            pool.map((p, i) => p.then(() => i)),
          );
          pool.splice(completedIndex, 1);
        }
      }
      await Promise.all(pool);

      e.target.value = "";
    } finally {
      setIsValidating(false);
    }
  };

  const removeFile = (token: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.download_token !== token));
  };

  // 检查是否可以提交
  const isSubmitReady = useMemo(() => {
    const hasContent = !!form.watch("content")?.trim();
    const hasFiles = uploadedFiles.length > 0;
    const isUploading = uploadTasks.size > 0;

    // 至少有内容或文件，且没有正在上传的文件
    return (hasContent || hasFiles) && !isUploading;
  }, [form, uploadedFiles.length, uploadTasks.size]);

  const onSubmit = async (values: FormValues) => {
    try {
      await createSubmission.mutateAsync({
        content: values.content || "",
        attachments:
          uploadedFiles.length > 0
            ? uploadedFiles.map((f) => f.download_token)
            : null,
      });
      notify.success(t("notify.submission.success"));
      navigate(`${prefix}/classes/${classId}/homework/${homeworkId}`);
    } catch (error) {
      logger.error("Failed to submit homework", error);
      notify.error(t("notify.submission.failed"), t("notify.tryAgainLater"));
    }
  };

  if (homeworkLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isDeadlinePassed && !homework?.allow_late) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link to={`${prefix}/classes/${classId}/homework/${homeworkId}`}>
            <FiArrowLeft className="mr-2 h-4 w-4" />
            {t("submitHomework.backToDetail")}
          </Link>
        </Button>
        <Alert variant="destructive">
          <FiAlertTriangle className="h-4 w-4" />
          <AlertTitle>{t("submitHomework.cannotSubmit")}</AlertTitle>
          <AlertDescription>
            {t("submitHomework.deadlinePassedNoLate")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link to={`${prefix}/classes/${classId}/homework/${homeworkId}`}>
          <FiArrowLeft className="mr-2 h-4 w-4" />
          {t("submitHomework.backToDetail")}
        </Link>
      </Button>

      {isLateSubmission && (
        <Alert className="mb-6">
          <FiAlertTriangle className="h-4 w-4" />
          <AlertTitle>{t("submitHomework.lateWarningTitle")}</AlertTitle>
          <AlertDescription>
            {t("submitHomework.lateWarningDesc")}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("submitHomework.title")}</CardTitle>
          <CardDescription>
            {homework?.title}
            {latestSubmission &&
              ` · ${t("submitHomework.versionNumber", { version: latestSubmission.version + 1 })}`}
          </CardDescription>
          {/* 关键信息：截止时间和满分 */}
          {homework && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              {homework.deadline && (
                <div className="flex items-center gap-1">
                  <FiClock className="h-4 w-4" />
                  <span>
                    {t("submitHomework.deadline")}:{" "}
                    {new Date(homework.deadline).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <FiAward className="h-4 w-4" />
                <span>
                  {t("submitHomework.maxScore")}: {homework.max_score}{" "}
                  {t("common.score")}
                </span>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* 作业要求折叠面板 */}
          {homework?.description && (
            <Collapsible defaultOpen className="mb-6">
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        {t("submitHomework.requirements")}
                      </CardTitle>
                      <FiChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {homework.description}
                    </p>
                    {/* 参考附件 */}
                    {homework.attachments &&
                      homework.attachments.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-2">
                            {t("submitHomework.referenceAttachments")}:
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {homework.attachments.map((file, index) => (
                              <FilePreviewDialog
                                key={file.download_token}
                                file={file}
                                files={homework.attachments}
                                initialIndex={index}
                                showThumbnail
                              />
                            ))}
                          </div>
                        </div>
                      )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("submitHomework.contentLabel")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("submitHomework.contentPlaceholder")}
                        rows={10}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("submitHomework.contentDesc")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 附件上传 */}
              <div className="space-y-3">
                <FormLabel>{t("submitHomework.attachmentLabel")}</FormLabel>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isValidating}
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                  >
                    {isValidating ? (
                      <>
                        <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                        {t("common.validating")}
                      </>
                    ) : (
                      <>
                        <FiUpload className="mr-2 h-4 w-4" />
                        {t("submitHomework.uploadFile")}
                      </>
                    )}
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.txt,.zip,.png,.jpg,.jpeg"
                  />
                </div>

                {/* 正在上传的文件 */}
                {[...uploadTasks.entries()].map(([fileName, task]) => (
                  <div
                    key={fileName}
                    className="p-3 rounded-lg border bg-muted/50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {task.status === "uploading" ? (
                        <FiUpload className="h-4 w-4 text-primary animate-pulse" />
                      ) : task.status === "error" ? (
                        <FiAlertCircle className="h-4 w-4 text-destructive" />
                      ) : task.status === "cancelled" ? (
                        <FiX className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <FiClock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm truncate flex-1">
                        {fileName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {task.progress}%
                      </span>
                      {(task.status === "uploading" ||
                        task.status === "pending") && (
                        <button
                          type="button"
                          onClick={() => handleCancelUpload(fileName)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <FiX className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <Progress value={task.progress} className="h-1" />
                  </div>
                ))}

                {/* 已上传的文件 */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.download_token}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-2">
                          <FiFile className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(file.download_token)}
                        >
                          <FiX className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    navigate(
                      `${prefix}/classes/${classId}/homework/${homeworkId}`,
                    )
                  }
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={!isSubmitReady || createSubmission.isPending}
                >
                  {createSubmission.isPending
                    ? t("submitHomework.submitting")
                    : t("submitHomework.submit")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
