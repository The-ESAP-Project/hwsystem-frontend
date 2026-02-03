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
import { useClass } from "@/features/class/hooks/useClass";
import { useRoutePrefix } from "@/features/class/hooks/useClassBasePath";
import { useSubmission } from "@/features/submission/hooks/useSubmission";
import type { GradeNavigationState } from "@/features/submission/pages/SubmissionListPage";
import { submissionService } from "@/features/submission/services/submissionService";
import { logger } from "@/lib/logger";
import { notify } from "@/stores/useNotificationStore";
import { useCreateGrade, useUpdateGrade } from "../hooks/useGrade";

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

  // 直接从 submission 获取评分信息，不再单独请求
  const existingGrade = submission?.grade;

  // 优先使用导航状态的 homeworkId，否则从 submission 中获取
  const homeworkId =
    navState?.homeworkId || submission?.homework_id?.toString();

  // 获取班级信息用于显示上下文
  const classId = navState?.classId?.toString();
  const { data: classData } = useClass(classId!);

  const createGrade = useCreateGrade(submissionId!, homeworkId);
  // useUpdateGrade 需要 gradeId，从 submission.grade 获取
  const updateGrade = useUpdateGrade(existingGrade?.id?.toString() || "", {
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

  // 重置 isAutoJumping 状态，防止跳转后卡在"提交中..."
  // biome-ignore lint/correctness/useExhaustiveDependencies: 需要在 submissionId 变化时重置状态
  useEffect(() => {
    setIsAutoJumping(false);
  }, [submissionId]);

  // 重置表单数据，无论是否有已有评分
  useEffect(() => {
    form.reset({
      score: existingGrade?.score ?? 0,
      comment: existingGrade?.comment ?? "",
    });
  }, [existingGrade, form]);

  // 计算导航信息
  const navigationInfo = useMemo(() => {
    if (!navState?.pendingList || navState.pendingList.length === 0) {
      return null;
    }

    const currentIndex = navState.pendingList.findIndex(
      (s) => String(s.id) === String(submissionId),
    );

    if (currentIndex === -1) {
      return null;
    }

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
        // 移除这里的 toast，避免重复提示
      } else {
        await createGrade.mutateAsync({
          score: values.score,
          comment: values.comment || null,
        });
        // 移除这里的 toast，避免重复提示
      }

      // 批改完成后的行为：通过 API 获取下一个待批改的提交
      if (homeworkId) {
        setIsAutoJumping(true);
        try {
          // 获取下一个待批改的提交
          const nextPending = await submissionService.getSummary(homeworkId, {
            graded: false,
            page_size: 1,
          });

          if (nextPending.items.length > 0) {
            const nextSubmission = nextPending.items[0];
            // 跳过当前正在批改的提交（因为刚批改完，可能还没更新）
            if (
              String(nextSubmission.latest_submission.id) ===
              String(submissionId)
            ) {
              // 如果返回的是当前提交，说明可能是缓存问题，再请求一次
              const retryPending = await submissionService.getSummary(
                homeworkId,
                {
                  graded: false,
                  page_size: 2,
                },
              );
              const filtered = retryPending.items.filter(
                (item) =>
                  String(item.latest_submission.id) !== String(submissionId),
              );
              if (filtered.length > 0) {
                notify.success(t("grade.navigation.autoNext"));
                navigate(
                  `${prefix}/submissions/${filtered[0].latest_submission.id}/grade`,
                  {
                    state: navState,
                  },
                );
              } else {
                // 全部批改完成
                notify.success(t("grade.navigation.allCompleted"));
                setTimeout(() => goBackToList(), 1200);
              }
            } else {
              notify.success(t("grade.navigation.autoNext"));
              navigate(
                `${prefix}/submissions/${nextSubmission.latest_submission.id}/grade`,
                {
                  state: navState,
                },
              );
            }
          } else {
            // 全部批改完成
            notify.success(t("grade.navigation.allCompleted"));
            setTimeout(() => goBackToList(), 1200);
          }
        } catch (error) {
          logger.warn("Failed to get next pending submission", error);
          // 获取下一个失败，直接返回列表
          setTimeout(() => goBackToList(), 500);
        }
      } else {
        // 没有 homeworkId，直接返回
        setTimeout(() => navigate(-1), 500);
      }
    } catch (error) {
      logger.error("Failed to submit grade", error);
      notify.error(t("grade.error.failed"), t("grade.error.retry"));
    }
  };

  const isLoading = submissionLoading;
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
      {/* 作业上下文信息条 */}
      {submission?.homework && (
        <Card className="mb-4">
          <CardContent className="py-3">
            <div className="flex items-center flex-wrap gap-2 text-sm">
              {classData?.name && (
                <>
                  <span className="text-muted-foreground">
                    {t("grade.context.class")}:
                  </span>
                  <span className="font-medium">{classData.name}</span>
                  <span className="text-muted-foreground mx-2">|</span>
                </>
              )}
              <span className="text-muted-foreground">
                {t("grade.context.homework")}:
              </span>
              <span className="font-medium">{submission.homework.title}</span>
              <span className="text-muted-foreground mx-2">|</span>
              <span className="text-muted-foreground">
                {t("grade.context.maxScore")}:
              </span>
              <span className="font-medium">
                {submission.homework.max_score} {t("common.score")}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 工作流导航条 */}
      {navigationInfo ? (
        <div className="mb-6 space-y-3">
          {/* 进度条和计数 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {t("grade.navigation.currentStudent")}:
                </span>
                <span className="font-medium text-foreground">
                  {navState?.pendingList[navigationInfo.current - 1]
                    ?.studentName || t("common.unknown")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {t("grade.navigation.progress")}:
                </span>
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {navigationInfo.current} / {navigationInfo.total}
                </Badge>
              </div>
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
                    {submission.attachments.map((file, index) => (
                      <FilePreviewDialog
                        key={file.download_token}
                        file={file}
                        files={submission.attachments}
                        initialIndex={index}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 评分表单 */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {/* 评分 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={submission?.creator?.avatar_url || undefined}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(submission?.creator?.display_name ||
                      submission?.creator?.username ||
                      "?")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {submission?.creator?.display_name ||
                      submission?.creator?.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{submission?.creator?.username}
                  </p>
                </div>
              </div>
              <div>
                <CardTitle className="text-base">
                  {isEditing ? t("grade.editGrade") : t("grade.grade")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t("grade.maxScore")} {submission?.homework?.max_score || 100}{" "}
                  {t("grade.points")}
                </CardDescription>
              </div>
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
                        <FormLabel className="text-sm">
                          {t("grade.score")}
                        </FormLabel>
                        {/* 快速评分按钮 - 精简版 */}
                        <div className="grid grid-cols-2 gap-2 mb-2">
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
                                className="h-9 text-sm justify-start"
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${preset.color} mr-2 shrink-0`}
                                />
                                <span className="truncate">
                                  {t(`grade.quickScore.${preset.key}`)}
                                </span>
                                <span className="ml-auto font-mono">
                                  {actualScore}
                                </span>
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
                        <FormDescription className="text-xs">
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
                        <FormLabel className="text-sm">
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
                          <SelectTrigger className="w-full mb-2 h-8 text-xs">
                            <SelectValue
                              placeholder={t("grade.selectTemplate")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMENT_TEMPLATE_KEYS.map((key) => (
                              <SelectItem
                                key={key}
                                value={key}
                                className="text-xs"
                              >
                                {t(`grade.commentTemplates.${key}.label`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormControl>
                          <Textarea
                            placeholder={t("grade.commentPlaceholder")}
                            rows={3}
                            className="text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(-1)}
                      disabled={isPending || isAutoJumping}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="flex-1"
                      disabled={
                        !form.formState.isValid || isPending || isAutoJumping
                      }
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
