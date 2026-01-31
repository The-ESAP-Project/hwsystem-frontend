import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiFile, FiUpload, FiX } from "react-icons/fi";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useRoutePrefix } from "@/features/class/hooks/useClassBasePath";
import { fileService } from "@/features/file/services/fileService";
import { validateFiles } from "@/features/file/services/fileValidation";
import { formatBatchFileValidationErrors } from "@/features/file/utils/formatFileError";
import { logger } from "@/lib/logger";
import { notify } from "@/stores/useNotificationStore";
import { useHomework, useUpdateHomework } from "../hooks/useHomework";

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

export function HomeworkEditPage() {
  const { t } = useTranslation();
  const formSchema = useFormSchema();
  const { classId, homeworkId } = useParams<{
    classId: string;
    homeworkId: string;
  }>();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { data: homework, isLoading, error } = useHomework(homeworkId!);
  const updateHomework = useUpdateHomework(homeworkId!);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );

  const isUploading = Object.keys(uploadProgress).length > 0;

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

  useEffect(() => {
    if (homework) {
      form.reset({
        title: homework.title,
        description: homework.description || "",
        max_score: homework.max_score,
        deadline: (() => {
          if (!homework.deadline) return "";
          const date = new Date(homework.deadline);
          return Number.isNaN(date.getTime())
            ? ""
            : date.toISOString().slice(0, 16);
        })(),
        allow_late:
          homework.allow_late_submission ?? homework.allow_late ?? false,
      });
      if (homework.attachments) {
        setUploadedFiles(
          homework.attachments.map((file) => ({
            download_token: file.download_token,
            name: file.original_name,
            size: Number(file.file_size),
          })),
        );
      }
    }
  }, [homework, form]);

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

    // 上传步骤
    for (const file of Array.from(files)) {
      // 初始化进度
      setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

      try {
        const result = await fileService.upload(file, {
          onProgress: (percent) => {
            setUploadProgress((prev) => ({ ...prev, [file.name]: percent }));
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
      } catch (error) {
        logger.error("Failed to upload file", error);
        notify.error(t("notify.file.uploadFailed"));
      } finally {
        // 移除进度状态
        setUploadProgress((prev) => {
          const { [file.name]: _, ...rest } = prev;
          return rest;
        });
      }
    }

    notify.success(t("notify.file.uploadSuccess"));
    e.target.value = "";
  };

  const removeFile = (token: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.download_token !== token));
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await updateHomework.mutateAsync({
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
      notify.success(t("notify.homework.updateSuccess"));
      navigate(`${prefix}/classes/${classId}/homework/${homeworkId}`);
    } catch (error) {
      logger.error("Failed to update homework", error);
      notify.error(
        t("notify.homework.updateFailed"),
        t("notify.tryAgainLater"),
      );
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-destructive">
          {t("common.loadError")}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-32 mb-4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link to={`${prefix}/classes/${classId}/homework/${homeworkId}`}>
          <FiArrowLeft className="mr-2 h-4 w-4" />
          {t("homeworkForm.backToDetail")}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{t("homeworkForm.editTitle")}</CardTitle>
          <CardDescription>{t("homeworkForm.editDescription")}</CardDescription>
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
                    disabled={isUploading}
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                  >
                    <FiUpload className="mr-2 h-4 w-4" />
                    {isUploading
                      ? t("homeworkForm.uploading")
                      : t("homeworkForm.uploadFile")}
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
                {Object.entries(uploadProgress).map(([fileName, progress]) => (
                  <div
                    key={fileName}
                    className="p-3 rounded-lg border bg-muted/50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FiUpload className="h-4 w-4 text-primary animate-pulse" />
                      <span className="text-sm">{fileName}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {progress}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-1" />
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
                          {file.size > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          )}
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
                <Button type="submit" disabled={updateHomework.isPending}>
                  {updateHomework.isPending
                    ? t("common.saving")
                    : t("common.save")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
