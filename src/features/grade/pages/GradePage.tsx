import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiList,
} from "react-icons/fi";
import { useLocation, useNavigate, useParams } from "react-router";
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
import { useRoutePrefix } from "@/features/class/hooks/useClassBasePath";
import { useSubmission } from "@/features/submission/hooks/useSubmission";
import type { GradeNavigationState } from "@/features/submission/pages/SubmissionListPage";
import { notify } from "@/stores/useNotificationStore";
import { useCreateGrade, useGrade, useUpdateGrade } from "../hooks/useGrade";

const formSchema = z.object({
  score: z.number().min(0, "分数不能为负"),
  comment: z.string().max(1000, "评语不能超过1000个字符").optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function GradePage() {
  const { t } = useTranslation();
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const prefix = useRoutePrefix();

  // 获取导航状态
  const navState = location.state as GradeNavigationState | null;

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

  // 计算导航信息
  const navigationInfo = useMemo(() => {
    if (!navState?.pendingList || navState.pendingList.length === 0)
      return null;

    const currentIndex = navState.pendingList.findIndex(
      (s) => s.id === submissionId,
    );
    if (currentIndex === -1) return null;

    return {
      current: currentIndex + 1,
      total: navState.pendingList.length,
      prev: currentIndex > 0 ? navState.pendingList[currentIndex - 1] : null,
      next:
        currentIndex < navState.pendingList.length - 1
          ? navState.pendingList[currentIndex + 1]
          : null,
    };
  }, [navState, submissionId]);

  // 导航到指定提交
  const navigateTo = useCallback(
    (targetId: string) => {
      navigate(`${prefix}/submissions/${targetId}/grade`, {
        state: navState,
        replace: true,
      });
    },
    [navigate, prefix, navState],
  );

  // 导航到上一个
  const goToPrev = useCallback(() => {
    if (navigationInfo?.prev) {
      navigateTo(navigationInfo.prev.id);
    }
  }, [navigationInfo, navigateTo]);

  // 导航到下一个
  const goToNext = useCallback(() => {
    if (navigationInfo?.next) {
      navigateTo(navigationInfo.next.id);
    }
  }, [navigationInfo, navigateTo]);

  // 返回列表
  const goBackToList = useCallback(() => {
    if (navState?.classId && navState?.homeworkId) {
      navigate(
        `${prefix}/classes/${navState.classId}/homework/${navState.homeworkId}/submissions`,
      );
    } else {
      navigate(-1);
    }
  }, [navigate, navState, prefix]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+← 上一个
      if (e.key === "ArrowLeft" && e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        goToPrev();
      }
      // Alt+→ 下一个
      if (e.key === "ArrowRight" && e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrev, goToNext]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing) {
        await updateGrade.mutateAsync({
          score: values.score,
          comment: values.comment || null,
        });
        notify.success(t("grade.success.updated") || "评分已更新");
      } else {
        await createGrade.mutateAsync({
          score: values.score,
          comment: values.comment || null,
        });
        notify.success(t("grade.success.created") || "评分成功");
      }

      // 批改完成后的行为
      if (navigationInfo?.next) {
        // 还有下一个，提示并可以继续
        notify.info(
          t("grade.navigation.continueHint") || "可点击「下一个」继续批改",
        );
      } else if (navigationInfo && !navigationInfo.next) {
        // 已完成所有
        notify.success(
          t("grade.navigation.allCompleted") || "所有待批改作业已完成！",
        );
        goBackToList();
      } else {
        // 没有导航状态，直接返回
        navigate(-1);
      }
    } catch {
      notify.error(
        t("grade.error.failed") || "操作失败",
        t("grade.error.retry") || "请稍后重试",
      );
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
      {/* 导航条 */}
      {navigationInfo ? (
        <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-muted/50 border">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrev}
            disabled={!navigationInfo.prev}
            className="gap-1"
          >
            <FiChevronLeft className="h-4 w-4" />
            {t("grade.navigation.prev")}
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {t("grade.navigation.progress")}:
            </span>
            <Badge variant="secondary">
              {navigationInfo.current}/{navigationInfo.total}
            </Badge>
            <span>{t("grade.navigation.pendingCount") || "待批改"}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            disabled={!navigationInfo.next}
            className="gap-1"
          >
            {t("grade.navigation.next")}
            <FiChevronRight className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
          <FiArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back")}
        </Button>
      )}

      {/* 返回列表按钮（当有导航状态时显示） */}
      {navigationInfo && navState && (
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={goBackToList}
        >
          <FiList className="mr-2 h-4 w-4" />
          {t("grade.navigation.backToList")}
        </Button>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 提交内容 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {t("grade.submissionContent") || "提交内容"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">v{submission?.version}</Badge>
                  {submission?.is_late && (
                    <Badge variant="secondary">
                      <FiClock className="mr-1 h-3 w-3" />
                      {t("submission.list.filter.late") || "迟交"}
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription>
                {t("grade.submittedAt") || "提交于"}{" "}
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
                <p className="text-muted-foreground">
                  {t("grade.noContent") || "无文字内容"}
                </p>
              )}

              {submission?.attachments && submission.attachments.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {t("grade.attachments") || "附件"} (
                    {submission.attachments.length})
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
              <CardTitle>{t("grade.studentInfo") || "学生信息"}</CardTitle>
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
              <CardTitle>
                {isEditing
                  ? t("grade.editGrade") || "修改评分"
                  : t("grade.grade") || "评分"}
              </CardTitle>
              <CardDescription>
                {t("grade.maxScore") || "满分"}{" "}
                {submission?.homework?.max_score || 100}{" "}
                {t("grade.points") || "分"}
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
                        <FormLabel>{t("grade.score") || "分数"}</FormLabel>
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
                          0 - {submission?.homework?.max_score || 100}{" "}
                          {t("grade.points") || "分"}
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
                        <FormLabel>
                          {t("grade.comment") || "评语"}（
                          {t("grade.optional") || "可选"}）
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={
                              t("grade.commentPlaceholder") || "给学生的反馈..."
                            }
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
                      {t("common.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isPending}
                    >
                      {isPending
                        ? t("grade.submitting") || "提交中..."
                        : isEditing
                          ? t("grade.updateGrade") || "更新评分"
                          : t("grade.submitGrade") || "提交评分"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* 快捷键提示 */}
          {navigationInfo && (
            <div className="text-xs text-muted-foreground text-center">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border">Alt</kbd>
              {" + "}
              <kbd className="px-1.5 py-0.5 rounded bg-muted border">←</kbd>
              {" / "}
              <kbd className="px-1.5 py-0.5 rounded bg-muted border">→</kbd>{" "}
              {t("grade.navigation.shortcutHint") || "快速切换"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
