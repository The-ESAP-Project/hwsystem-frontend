import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useRoutePrefix } from "@/features/class/hooks/useClassBasePath";
import { fileService } from "@/features/file/services/fileService";
import { useHomework } from "@/features/homework/hooks/useHomework";
import { notify } from "@/stores/useNotificationStore";
import {
  useCreateSubmission,
  useMyLatestSubmission,
} from "../hooks/useSubmission";

const formSchema = z.object({
  content: z.string().max(10000, "内容不能超过10000个字符").optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface UploadedFile {
  download_token: string;
  name: string;
  size: number;
}

export function SubmitHomeworkPage() {
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
  const [uploading, setUploading] = useState(false);

  const isDeadlinePassed = homework?.deadline
    ? new Date(homework.deadline) < new Date()
    : false;
  const isLateSubmission = isDeadlinePassed && homework?.allow_late_submission;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const result = await fileService.upload(file);
        setUploadedFiles((prev) => [
          ...prev,
          {
            download_token: result.download_token,
            name: result.file_name,
            size: Number(result.size),
          },
        ]);
      }
      notify.success("文件上传成功");
    } catch {
      notify.error("文件上传失败");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeFile = (token: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.download_token !== token));
  };

  const onSubmit = async (values: FormValues) => {
    if (!values.content && uploadedFiles.length === 0) {
      notify.warning("请填写作业内容或上传附件");
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
      notify.success("作业提交成功");
      navigate(`${prefix}/classes/${classId}/homework/${homeworkId}`);
    } catch {
      notify.error("提交失败", "请稍后重试");
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

  if (isDeadlinePassed && !homework?.allow_late_submission) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link to={`${prefix}/classes/${classId}/homework/${homeworkId}`}>
            <FiArrowLeft className="mr-2 h-4 w-4" />
            返回作业详情
          </Link>
        </Button>
        <Alert variant="destructive">
          <FiAlertTriangle className="h-4 w-4" />
          <AlertTitle>无法提交</AlertTitle>
          <AlertDescription>作业已截止，且不允许迟交。</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link to={`${prefix}/classes/${classId}/homework/${homeworkId}`}>
          <FiArrowLeft className="mr-2 h-4 w-4" />
          返回作业详情
        </Link>
      </Button>

      {isLateSubmission && (
        <Alert className="mb-6">
          <FiAlertTriangle className="h-4 w-4" />
          <AlertTitle>迟交提醒</AlertTitle>
          <AlertDescription>
            作业已截止，此次提交将被标记为迟交。
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>提交作业</CardTitle>
          <CardDescription>
            {homework?.title}
            {latestSubmission && ` · 第 ${latestSubmission.version + 1} 次提交`}
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
                    <FormLabel>作业内容</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="在这里填写你的作业内容..."
                        rows={10}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      支持纯文本，可以配合附件一起提交
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 附件上传 */}
              <div className="space-y-3">
                <FormLabel>附件（可选）</FormLabel>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                  >
                    <FiUpload className="mr-2 h-4 w-4" />
                    {uploading ? "上传中..." : "上传文件"}
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
                  取消
                </Button>
                <Button type="submit" disabled={createSubmission.isPending}>
                  {createSubmission.isPending ? "提交中..." : "提交作业"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
