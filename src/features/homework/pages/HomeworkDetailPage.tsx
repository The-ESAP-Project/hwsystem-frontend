import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiEdit2, FiPaperclip, FiTrash2 } from "react-icons/fi";
import { Link, useNavigate, useParams } from "react-router";
import { FilePreviewDialog } from "@/components/file/FilePreviewDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermission } from "@/features/auth/hooks/usePermission";
import { useClass } from "@/features/class/hooks/useClass";
import { useRoutePrefix } from "@/features/class/hooks/useClassBasePath";
import {
  useMyLatestSubmission,
  useSubmissionSummary,
} from "@/features/submission/hooks/useSubmission";
import type { GradeNavigationState } from "@/features/submission/pages/SubmissionListPage";
import { logger } from "@/lib/logger";
import { notify } from "@/stores/useNotificationStore";
import { useCurrentUser } from "@/stores/useUserStore";
import { HomeworkInfoCard } from "../components/HomeworkInfoCard";
import { MySubmissionCard } from "../components/MySubmissionCard";
import { SubmissionManagementCard } from "../components/SubmissionManagementCard";
import { useDeleteHomework, useHomework } from "../hooks/useHomework";
import { useHomeworkStatus } from "../hooks/useHomeworkStatus";

export function HomeworkDetailPage() {
  const { t } = useTranslation();
  const { classId, homeworkId } = useParams<{
    classId: string;
    homeworkId: string;
  }>();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const prefix = useRoutePrefix();
  const { canDeleteHomework } = usePermission();

  const { data: classData } = useClass(classId!);
  const { data: homework, isLoading, error } = useHomework(homeworkId!);
  const { data: mySubmission } = useMyLatestSubmission(homeworkId!);
  const deleteHomework = useDeleteHomework();

  // 使用 URL 前缀判断视图类型，避免依赖异步加载的 classData
  const isTeacherView = prefix === "/teacher" || prefix === "/admin";
  // 保留原判断用于权限控制（如删除按钮）
  const hasTeacherPermission =
    classData?.teacher?.id === user?.id || canDeleteHomework;
  // 是否可以查看提交情况（教师、课代表、管理员）
  const canViewSubmissions =
    isTeacherView ||
    classData?.my_role === "class_representative" ||
    classData?.my_role === "teacher";
  // 是否可以编辑/删除作业（仅教师和管理员）
  const canEditHomework = isTeacherView && hasTeacherPermission;
  // 是否有评分权限（只有教师才能评分，课代表不能）
  const canGrade = isTeacherView && classData?.my_role === "teacher";

  // 获取待批改的提交（使用 graded=false 筛选，避免分页问题）
  const { data: pendingData } = useSubmissionSummary(
    homeworkId!,
    { graded: false },
    canGrade,
  );

  // 待批改列表和数量
  const pendingSubmissions = pendingData?.items ?? [];
  const pendingCount = Number(
    pendingData?.pagination?.total ?? pendingSubmissions.length,
  );

  // 使用 useHomeworkStatus Hook 计算状态
  const { canSubmit, statusLabel, statusVariant } = useHomeworkStatus(homework);

  // 渲染状态徽章
  const renderStatusBadge = () => {
    if (!statusVariant) return null;
    return <Badge variant={statusVariant}>{statusLabel}</Badge>;
  };

  // 导航到批改页（带导航状态）
  const navigateToGrade = (submissionId: string) => {
    const navState: GradeNavigationState = {
      pendingList: pendingSubmissions.map((s) => ({
        id: String(s.latest_submission.id),
        studentName: s.creator.display_name || s.creator.username,
      })),
      homeworkId: homeworkId!,
      classId: classId!,
    };

    navigate(`${prefix}/submissions/${submissionId}/grade`, {
      state: navState,
    });
  };

  const handleDelete = async () => {
    try {
      await deleteHomework.mutateAsync(homeworkId!);
      notify.success(t("notify.homework.deleteSuccess"));
      navigate(`${prefix}/classes/${classId}`);
    } catch (error) {
      logger.error("Failed to delete homework", error);
      notify.error(t("notify.homework.deleteFailed"));
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-destructive">
          {t("common.loadError")}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link to={`${prefix}/classes/${classId}`}>
          <FiArrowLeft className="mr-2 h-4 w-4" />
          {t("homeworkPage.backToClass")}
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 主要内容 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{homework?.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {t("homeworkPage.maxScore", { score: homework?.max_score })}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {renderStatusBadge()}
                  {canEditHomework && (
                    <>
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          to={`${prefix}/classes/${classId}/homework/${homeworkId}/edit`}
                        >
                          <FiEdit2 className="mr-2 h-4 w-4" />
                          {t("homeworkPage.edit")}
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <FiTrash2 className="mr-2 h-4 w-4" />
                            {t("homeworkPage.delete")}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t("homeworkPage.deleteConfirm.title")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("homeworkPage.deleteConfirm.description")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {t("homeworkPage.deleteConfirm.cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDelete}
                              className="bg-destructive text-destructive-foreground"
                            >
                              {t("homeworkPage.deleteConfirm.confirm")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-foreground whitespace-pre-wrap">
                  {homework?.description || t("homeworkPage.noDescription")}
                </p>
              </div>

              {/* 附件 */}
              {homework?.attachments && homework.attachments.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    <FiPaperclip className="inline-block mr-2 h-4 w-4" />
                    {t("homeworkPage.attachments")}
                  </h3>
                  <div className="space-y-2">
                    {homework.attachments.map((file, index) => (
                      <FilePreviewDialog
                        key={file.download_token}
                        file={file}
                        files={homework.attachments}
                        initialIndex={index}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 我的提交 */}
          {!isTeacherView && (
            <MySubmissionCard
              submission={mySubmission}
              maxScore={homework?.max_score}
              canSubmit={canSubmit}
              prefix={prefix}
              classId={classId!}
              homeworkId={homeworkId!}
            />
          )}
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          <HomeworkInfoCard homework={homework} />

          {canViewSubmissions && (
            <SubmissionManagementCard
              canGrade={canGrade}
              pendingCount={pendingCount}
              onStartGrading={() =>
                navigateToGrade(
                  String(pendingSubmissions[0].latest_submission.id),
                )
              }
              prefix={prefix}
              classId={classId!}
              homeworkId={homeworkId!}
            />
          )}
        </div>
      </div>
    </div>
  );
}
