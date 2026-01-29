import { useTranslation } from "react-i18next";
import {
  FiArrowLeft,
  FiBarChart2,
  FiEdit2,
  FiPaperclip,
  FiPlayCircle,
  FiTrash2,
  FiUpload,
} from "react-icons/fi";
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
import { useDeleteHomework, useHomework } from "../hooks/useHomework";

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
    canGrade ? { graded: false } : undefined,
  );

  // 待批改列表和数量
  const pendingSubmissions = pendingData?.items ?? [];
  const pendingCount = Number(
    pendingData?.pagination?.total ?? pendingSubmissions.length,
  );

  const isDeadlinePassed = homework?.deadline
    ? new Date(homework.deadline) < new Date()
    : false;
  const canSubmit = !isDeadlinePassed || homework?.allow_late;

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

  const getStatusBadge = () => {
    if (!homework?.deadline) return null;
    const deadline = new Date(homework.deadline);
    const now = new Date();
    if (now > deadline) {
      return (
        <Badge variant="destructive">{t("homeworkPage.status.expired")}</Badge>
      );
    }
    const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursLeft < 24) {
      return (
        <Badge variant="secondary">
          {t("homeworkPage.status.expiringSoon")}
        </Badge>
      );
    }
    return (
      <Badge variant="default">{t("homeworkPage.status.inProgress")}</Badge>
    );
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
                  {getStatusBadge()}
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
                    {homework.attachments.map((file) => (
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

          {/* 我的提交 */}
          {!isTeacherView && (
            <Card>
              <CardHeader>
                <CardTitle>{t("homeworkPage.mySubmission")}</CardTitle>
              </CardHeader>
              <CardContent>
                {mySubmission ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {t("homeworkPage.submissionVersion", {
                            version: mySubmission.version,
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t("homeworkPage.submittedAt")}{" "}
                          {new Date(mySubmission.submitted_at).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        {mySubmission.grade ? (
                          <Badge variant="default">
                            {mySubmission.grade.score} / {homework?.max_score}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {t("homeworkPage.pendingGrade")}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {mySubmission.grade?.comment && (
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-sm text-muted-foreground">
                          {t("homeworkPage.teacherComment")}
                        </p>
                        <p className="mt-1">{mySubmission.grade.comment}</p>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <Button variant="outline" asChild>
                        <Link
                          to={`${prefix}/homework/${homeworkId}/submissions`}
                        >
                          {t("homeworkPage.viewHistory")}
                        </Link>
                      </Button>
                      {canSubmit && (
                        <Button asChild>
                          <Link
                            to={`${prefix}/classes/${classId}/homework/${homeworkId}/submit`}
                          >
                            <FiUpload className="mr-2 h-4 w-4" />
                            {t("homeworkPage.resubmit")}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">
                      {t("homeworkPage.notSubmitted")}
                    </p>
                    {canSubmit ? (
                      <Button asChild>
                        <Link
                          to={`${prefix}/classes/${classId}/homework/${homeworkId}/submit`}
                        >
                          <FiUpload className="mr-2 h-4 w-4" />
                          {t("homeworkPage.submitHomework")}
                        </Link>
                      </Button>
                    ) : (
                      <p className="text-sm text-destructive">
                        {t("homeworkPage.deadlinePassed")}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("homeworkPage.homeworkInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {homework?.creator && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("homeworkPage.creator")}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={homework.creator?.avatar_url || undefined}
                      />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {(homework.creator.display_name ||
                          homework.creator.username ||
                          "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium">
                      {homework.creator.display_name ||
                        homework.creator.username}
                    </p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("homeworkPage.deadline")}
                </p>
                <p className="font-medium">
                  {homework?.deadline
                    ? new Date(homework.deadline).toLocaleString()
                    : t("homeworkPage.noDeadline")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("homeworkPage.allowLate")}
                </p>
                <p className="font-medium">
                  {homework?.allow_late
                    ? t("homeworkPage.yes")
                    : t("homeworkPage.no")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("homeworkPage.attachmentCount")}
                </p>
                <p className="font-medium">
                  {homework?.attachments?.length || 0}{" "}
                  {t("homeworkPage.attachmentUnit")}
                </p>
              </div>
            </CardContent>
          </Card>

          {canViewSubmissions && (
            <Card>
              <CardHeader>
                <CardTitle>{t("homeworkPage.submissionManagement")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canGrade && pendingCount > 0 && (
                  <Button
                    className="w-full"
                    onClick={() =>
                      navigateToGrade(
                        String(pendingSubmissions[0].latest_submission.id),
                      )
                    }
                  >
                    <FiPlayCircle className="mr-2 h-4 w-4" />
                    {t("submission.list.startGrading")}
                    <Badge variant="secondary" className="ml-2">
                      {pendingCount}
                    </Badge>
                  </Button>
                )}
                <Button variant="outline" className="w-full" asChild>
                  <Link
                    to={`${prefix}/classes/${classId}/homework/${homeworkId}/submissions`}
                  >
                    <FiBarChart2 className="mr-2 h-4 w-4" />
                    {t("homeworkPage.viewSubmissions")}
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link
                    to={`${prefix}/classes/${classId}/homework/${homeworkId}/stats`}
                  >
                    <FiBarChart2 className="mr-2 h-4 w-4" />
                    {t("homeworkPage.homeworkStats")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
