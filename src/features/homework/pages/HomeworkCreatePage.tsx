import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { fileService } from "@/features/file/services/fileService";
import { notify } from "@/stores/useNotificationStore";
import { useCreateHomework } from "../hooks/useHomework";

const formSchema = z.object({
  title: z.string().min(1, "请输入作业标题").max(200, "标题不能超过200个字符"),
  description: z.string().max(5000, "内容不能超过5000个字符").optional(),
  max_score: z.number().min(1, "满分必须大于0").max(1000, "满分不能超过1000"),
  deadline: z.string().optional(),
  allow_late: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface UploadedFile {
  download_token: string;
  name: string;
  size: number;
}

export function HomeworkCreatePage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const createHomework = useCreateHomework(classId!);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

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
      notify.success("作业创建成功");
      navigate(`/user/classes/${classId}`);
    } catch {
      notify.error("创建失败", "请稍后重试");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link to={`/user/classes/${classId}`}>
          <FiArrowLeft className="mr-2 h-4 w-4" />
          返回班级
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>布置作业</CardTitle>
          <CardDescription>创建新的作业任务</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>作业标题</FormLabel>
                    <FormControl>
                      <Input placeholder="例如：链表实现" {...field} />
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
                    <FormLabel>作业描述（可选）</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="详细描述作业要求..."
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
                      <FormLabel>满分</FormLabel>
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
                      <FormLabel>截止时间（可选）</FormLabel>
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
                      <FormLabel>允许迟交</FormLabel>
                      <FormDescription>截止后学生仍可提交作业</FormDescription>
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
                  onClick={() => navigate(`/user/classes/${classId}`)}
                >
                  取消
                </Button>
                <Button type="submit" disabled={createHomework.isPending}>
                  {createHomework.isPending ? "创建中..." : "创建作业"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
