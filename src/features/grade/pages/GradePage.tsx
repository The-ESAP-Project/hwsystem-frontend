import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { FiArrowLeft, FiClock } from "react-icons/fi";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { FilePreviewDialog } from "@/components/file/FilePreviewDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useSubmission } from "@/features/submission/hooks/useSubmission";
import { notify } from "@/stores/useNotificationStore";
import { useCreateGrade, useGrade, useUpdateGrade } from "../hooks/useGrade";

const formSchema = z.object({
  score: z.number().min(0, "分数不能为负"),
  comment: z.string().max(1000, "评语不能超过1000个字符").optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function GradePage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();

  const { data: submission, isLoading: submissionLoading } = useSubmission(
    submissionId!,
  );
  const { data: existingGrade, isLoading: gradeLoading } = useGrade(
    submissionId!,
  );
  const createGrade = useCreateGrade(submissionId!);
  // useUpdateGrade 需要 gradeId，在有 existingGrade 时才能使用
  const updateGrade = useUpdateGrade(existingGrade?.id || "");

  const isEditing = !!existingGrade;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      score: 0,
      comment: "",
    },
  });

  useEffect(() => {
    if (existingGrade) {
      form.reset({
        score: existingGrade.score,
        comment: existingGrade.comment || "",
      });
    }
  }, [existingGrade, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing) {
        await updateGrade.mutateAsync({
          score: values.score,
          comment: values.comment || null,
        });
        notify.success("评分已更新");
      } else {
        await createGrade.mutateAsync({
          score: values.score,
          comment: values.comment || null,
        });
        notify.success("评分成功");
      }
      navigate(-1);
    } catch {
      notify.error("操作失败", "请稍后重试");
    }
  };

  const isLoading = submissionLoading || gradeLoading;
  const isPending = createGrade.isPending || updateGrade.isPending;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        <FiArrowLeft className="mr-2 h-4 w-4" />
        返回
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 提交内容 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>提交内容</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">v{submission?.version}</Badge>
                  {submission?.is_late && (
                    <Badge variant="secondary">
                      <FiClock className="mr-1 h-3 w-3" />
                      迟交
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription>
                提交于{" "}
                {submission?.submitted_at &&
                  new Date(submission.submitted_at).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {submission?.content ? (
                <div className="p-4 rounded-lg bg-muted whitespace-pre-wrap">
                  {submission.content}
                </div>
              ) : (
                <p className="text-muted-foreground">无文字内容</p>
              )}

              {submission?.attachments && submission.attachments.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    附件 ({submission.attachments.length})
                  </p>
                  <div className="space-y-2">
                    {submission.attachments.map((file) => (
                      <FilePreviewDialog
                        key={file.download_token}
                        file={file}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 评分表单 */}
        <div className="space-y-6">
          {/* 学生信息 */}
          <Card>
            <CardHeader>
              <CardTitle>学生信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {(submission?.creator?.display_name ||
                      submission?.creator?.username ||
                      "?")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {submission?.creator?.display_name ||
                      submission?.creator?.username}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    @{submission?.creator?.username}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 评分 */}
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? "修改评分" : "评分"}</CardTitle>
              <CardDescription>
                满分 {submission?.homework?.max_score || 100} 分
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>分数</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={submission?.homework?.max_score || 100}
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          0 - {submission?.homework?.max_score || 100} 分
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="comment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>评语（可选）</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="给学生的反馈..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(-1)}
                    >
                      取消
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isPending}
                    >
                      {isPending
                        ? "提交中..."
                        : isEditing
                          ? "更新评分"
                          : "提交评分"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
