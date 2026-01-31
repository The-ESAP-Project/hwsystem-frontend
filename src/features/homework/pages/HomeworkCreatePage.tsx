import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiClock,
  FiFile,
  FiUpload,
  FiX,
} from "react-icons/fi";
import { Link, useNavigate, useParams } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useRoutePrefix } from "@/features/class/hooks/useClassBasePath";
import { fileService } from "@/features/file/services/fileService";
import { validateFiles } from "@/features/file/services/fileValidation";
import { formatBatchFileValidationErrors } from "@/features/file/utils/formatFileError";
import { logger } from "@/lib/logger";
import { notify } from "@/stores/useNotificationStore";
import { useCreateHomework } from "../hooks/useHomework";

function useFormSchema() {
  const { t } = useTranslation();
  return useMemo(
    () =>
      z.object({
        title: z
          .string()
          .min(1, t("homeworkForm.validation.titleRequired"))
          .max(200, t("homeworkForm.validation.titleMaxLength")),
        description: z
          .string()
          .max(5000, t("homeworkForm.validation.descriptionMaxLength"))
          .optional(),
        max_score: z
          .number()
          .min(1, t("homeworkForm.validation.maxScoreMin"))
          .max(1000, t("homeworkForm.validation.maxScoreMax")),
        deadline: z.string().optional(),
        allow_late: z.boolean(),
      }),
    [t],
  );
}

type FormValues = z.infer<ReturnType<typeof useFormSchema>>;

interface UploadedFile {
  download_token: string;
  name: string;
  size: number;
}

interface UploadTask {
  file: File;
  progress: number;
  controller: AbortController;
  status: "pending" | "uploading" | "completed" | "cancelled" | "error";
}

const MAX_CONCURRENT_UPLOADS = 3;

export function HomeworkCreatePage() {
  const { t } = useTranslation();
  const formSchema = useFormSchema();
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const createHomework = useCreateHomework(classId!);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadTasks, setUploadTasks] = useState<Map<string, UploadTask>>(
    new Map(),
  );

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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      max_score: 100,
      deadline: "",
      allow_late: false,
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 客户端验证
    const validationResult = validateFiles(Array.from(files));

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
  };

  const removeFile = (token: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.download_token !== token));
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await createHomework.mutateAsync({
        title: values.title,
        description: values.description || null,
        max_score: values.max_score,
        deadline: values.deadline
          ? new Date(values.deadline).toISOString()
          : null,
        allow_late: values.allow_late,
        attachments:
          uploadedFiles.length > 0
            ? uploadedFiles.map((f) => f.download_token)
            : null,
      });
      notify.success(t("notify.homework.createSuccess"));
      navigate(`${prefix}/classes/${classId}`);
    } catch (error) {
      logger.error("Failed to create homework", error);
      notify.error(
        t("notify.homework.createFailed"),
        t("notify.tryAgainLater"),
      );
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link to={`${prefix}/classes/${classId}`}>
          <FiArrowLeft className="mr-2 h-4 w-4" />
          {t("homeworkPage.backToClass")}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{t("homeworkForm.createTitle")}</CardTitle>
          <CardDescription>
            {t("homeworkForm.createDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("homeworkForm.titleLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("homeworkForm.titlePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("homeworkForm.descriptionLabel")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("homeworkForm.descriptionPlaceholder")}
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="max_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("homeworkForm.maxScoreLabel")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={1000}
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("homeworkForm.deadlineLabel")}</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="allow_late"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>{t("homeworkForm.allowLateLabel")}</FormLabel>
                      <FormDescription>
                        {t("homeworkForm.allowLateDescription")}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* 附件上传 */}
              <div className="space-y-3">
                <FormLabel>{t("homeworkForm.attachmentLabel")}</FormLabel>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                  >
                    <FiUpload className="mr-2 h-4 w-4" />
                    {t("homeworkForm.uploadFile")}
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
                      <span className="text-sm truncate flex-1">{fileName}</span>
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
                  onClick={() => navigate(`${prefix}/classes/${classId}`)}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={createHomework.isPending}>
                  {createHomework.isPending
                    ? t("common.creating")
                    : t("homeworkForm.createHomework")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
