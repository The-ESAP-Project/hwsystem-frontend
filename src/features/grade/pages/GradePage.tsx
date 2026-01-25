import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiList,
  FiCheck,
} from "react-icons/fi";
import { useLocation, useNavigate, useParams } from "react-router";
import { z } from "zod";
import { FilePreviewDialog } from "@/components/file/FilePreviewDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useRoutePrefix } from "@/features/class/hooks/useClassBasePath";
import { useSubmission } from "@/features/submission/hooks/useSubmission";
import type { GradeNavigationState } from "@/features/submission/pages/SubmissionListPage";
import { notify } from "@/stores/useNotificationStore";
import { useCreateGrade, useGrade, useUpdateGrade } from "../hooks/useGrade";

// 快速评分预设
const QUICK_SCORES = [
  { key: "excellent", score: 100, color: "bg-green-500" },
  { key: "good", score: 85, color: "bg-blue-500" },
  { key: "average", score: 75, color: "bg-yellow-500" },
  { key: "pass", score: 60, color: "bg-orange-500" },
] as const;

// 常用评语模板 keys
const COMMENT_TEMPLATE_KEYS = [
  "excellent",
  "good",
  "needImprove",
  "late",
  "incomplete",
] as const;

const formSchema = z.object({
  score: z.number().min(0),
  comment: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function GradePage() {
  const { t } = useTranslation();
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const prefix = useRoutePrefix();
  const [isAutoJumping, setIsAutoJumping] = useState(false);

  // 获取导航状态
  const navState = location.state as GradeNavigationState | null;

  const { data: submission, isLoading: submissionLoading } = useSubmission(
    submissionId!,
  );
  const { data: existingGrade, isLoading: gradeLoading } = useGrade(
    submissionId!,
  );

  // 优先使用导航状态的 homeworkId，否则从 submission 中获取
  const homeworkId =
    navState?.homeworkId || submission?.homework_id?.toString();

  const createGrade = useCreateGrade(submissionId!, homeworkId);
  // useUpdateGrade 需要 gradeId，在有 existingGrade 时才能使用
  const updateGrade = useUpdateGrade(existingGrade?.id || "", {
    submissionId,
    homeworkId,
  });

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
        notify.success(t("grade.success.updated"));
      } else {
        await createGrade.mutateAsync({
          score: values.score,
          comment: values.comment || null,
        });
        notify.success(t("grade.success.created"));
      }

      // 批改完成后的行为
      if (navigationInfo?.next) {
        // 还有下一个，自动跳转
        setIsAutoJumping(true);
        notify.success(t("grade.navigation.autoNext"));
        setTimeout(() => {
          goToNext();
          setIsAutoJumping(false);
        }, 800); // 给用户足够时间看到成功提示
      } else if (navigationInfo && !navigationInfo.next) {
        // 已完成所有
        setIsAutoJumping(true);
        notify.success(t("grade.navigation.allCompleted"));
        setTimeout(() => {
          goBackToList();
        }, 1200);
      } else {
        // 没有导航状态，直接返回
        setTimeout(() => {
          navigate(-1);
        }, 500);
      }
    } catch {
      notify.error(t("grade.error.failed"), t("grade.error.retry"));
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
      {/* 工作流导航条 */}
      {navigationInfo ? (
        <div className="mb-6 space-y-3">
          {/* 进度条和计数 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground flex items-center gap-2">
                <FiCheck className="h-4 w-4 text-green-600" />
                {t("grade.navigation.progress")}
              </span>
              <Badge variant="secondary" className="text-base px-3 py-1">
                {navigationInfo.current} / {navigationInfo.total}
              </Badge>
            </div>
            <Progress 
              value={(navigationInfo.current / navigationInfo.total) * 100} 
              className="h-2"
            />
          </div>

          {/* 导航按钮 */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={goToPrev}
              disabled={!navigationInfo.prev || isAutoJumping}
              className="flex-1 gap-2"
            >
              <FiChevronLeft className="h-4 w-4" />
              {t("grade.navigation.prev")}
              {navigationInfo.prev && (
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                  ({navigationInfo.prev.studentName})
                </span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={goBackToList}
              className="gap-1.5"
            >
              <FiList className="h-4 w-4" />
              {t("grade.navigation.backToList")}
            </Button>

            <Button
              variant="outline"
              onClick={goToNext}
              disabled={!navigationInfo.next || isAutoJumping}
              className="flex-1 gap-2"
            >
              {navigationInfo.next && (
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                  ({navigationInfo.next.studentName})
                </span>
              )}
              {t("grade.navigation.next")}
              <FiChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
          <FiArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back")}
        </Button>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 提交内容 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("grade.submissionContent")}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">v{submission?.version}</Badge>
                  {submission?.is_late && (
                    <span className="flex items-center gap-1 text-orange-600 font-medium">
                      <FiClock className="h-4 w-4" />
                      {t("submission.list.filter.late")}
                    </span>
                  )}
                </div>
              </div>
              <CardDescription>
                {t("grade.submittedAt")}{" "}
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
                <p className="text-muted-foreground">{t("grade.noContent")}</p>
              )}

              {submission?.attachments && submission.attachments.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {t("grade.attachments")} ({submission.attachments.length})
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
              <CardTitle>{t("grade.studentInfo")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={submission?.creator?.avatar_url || undefined}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
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
                {isEditing ? t("grade.editGrade") : t("grade.grade")}
              </CardTitle>
              <CardDescription>
                {t("grade.maxScore")} {submission?.homework?.max_score || 100}{" "}
                {t("grade.points")}
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
                        <FormLabel>{t("grade.score")}</FormLabel>
                        {/* 快速评分按钮 */}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {QUICK_SCORES.map((preset) => {
                            // 根据满分比例计算实际分数
                            const maxScore =
                              submission?.homework?.max_score || 100;
                            const actualScore = Math.round(
                              (preset.score / 100) * maxScore,
                            );
                            return (
                              <Button
                                key={preset.key}
                                type="button"
                                variant={
                                  field.value === actualScore
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => field.onChange(actualScore)}
                                className="cursor-pointer"
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${preset.color} mr-1.5`}
                                />
                                {t(`grade.quickScore.${preset.key}`)} (
                                {actualScore})
                              </Button>
                            );
                          })}
                        </div>
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
                          {t("grade.points")}
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
                          {t("grade.comment")}（{t("grade.optional")}）
                        </FormLabel>
                        {/* 常用评语下拉 */}
                        <Select
                          onValueChange={(value) => {
                            const templateValue = t(
                              `grade.commentTemplates.${value}.value`,
                            );
                            if (templateValue) {
                              // 追加到现有评语（如果有的话）
                              const currentComment = field.value || "";
                              const newComment = currentComment
                                ? `${currentComment}\n${templateValue}`
                                : templateValue;
                              field.onChange(newComment);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full mb-2">
                            <SelectValue
                              placeholder={t("grade.selectTemplate")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMENT_TEMPLATE_KEYS.map((key) => (
                              <SelectItem key={key} value={key}>
                                {t(`grade.commentTemplates.${key}.label`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormControl>
                          <Textarea
                            placeholder={t("grade.commentPlaceholder")}
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col gap-2">
                    {/* 主要按钮组 */}
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate(-1)}
                        disabled={isPending || isAutoJumping}
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={isPending || isAutoJumping}
                      >
                        {isPending || isAutoJumping
                          ? t("grade.submitting")
                          : navigationInfo?.next
                            ? t("grade.submitAndNext")
                            : isEditing
                              ? t("grade.updateGrade")
                              : t("grade.submitGrade")}
                        {navigationInfo?.next && !isPending && !isAutoJumping && (
                          <FiChevronRight className="ml-1 h-4 w-4" />
                        )}
                      </Button>
                    </div>
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
              {t("grade.navigation.shortcutHint")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
