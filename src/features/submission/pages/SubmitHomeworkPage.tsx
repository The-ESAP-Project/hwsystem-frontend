import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiFile,
  FiUpload,
  FiX,
} from "react-icons/fi";
import { Link, useNavigate, useParams } from "react-router";
import { z } from "zod";
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
import { formatBatchFileValidationErrors } from "@/features/file/utils/formatFileError";
import { useHomework } from "@/features/homework/hooks/useHomework";
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

interface UploadedFile {
  download_token: string;
  name: string;
  size: number;
}

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
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );

  const isUploading = Object.keys(uploadProgress).length > 0;

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
    if (!values.content && uploadedFiles.length === 0) {
      notify.warning(t("notify.submission.contentRequired"));
      return;
    }

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
        </CardHeader>
        <CardContent>
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
                    disabled={isUploading}
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                  >
                    <FiUpload className="mr-2 h-4 w-4" />
                    {isUploading
                      ? t("submitHomework.uploading")
                      : t("submitHomework.uploadFile")}
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
                <Button type="submit" disabled={createSubmission.isPending}>
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
