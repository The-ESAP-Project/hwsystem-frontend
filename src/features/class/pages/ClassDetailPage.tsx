import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiArrowLeft,
  FiCopy,
  FiDownload,
  FiEdit2,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";
import { Link, useNavigate, useParams } from "react-router";
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
import { HomeworkListCard } from "@/features/homework/components";
import { notify } from "@/stores/useNotificationStore";
import { useCurrentUser } from "@/stores/useUserStore";
import { useClass, useDeleteClass } from "../hooks/useClass";
import { useRoutePrefix } from "../hooks/useClassBasePath";
import { classService } from "../services/classService";

export function ClassDetailPage() {
  const { t } = useTranslation();
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const { canManageClass } = usePermission();
  const prefix = useRoutePrefix();
  const [isExporting, setIsExporting] = useState(false);

  const {
    data: classData,
    isLoading: classLoading,
    error: classError,
  } = useClass(classId!);
  const deleteClass = useDeleteClass();

  const isTeacher = classData?.teacher?.id === user?.id || canManageClass;
  // 课代表或教师可以导出报表
  const canExport = isTeacher || classData?.my_role === "class_representative";

  const handleExportReport = async () => {
    if (!classId) return;
    setIsExporting(true);
    try {
      await classService.exportClassReport(classId);
      notify.success(t("classPage.exportSuccess"));
    } catch {
      notify.error(t("classPage.exportFailed"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyInviteCode = () => {
    if (classData?.invite_code) {
      navigator.clipboard.writeText(classData.invite_code);
      notify.success(t("notify.class.inviteCodeCopied"));
    }
  };

  const handleDeleteClass = async () => {
    try {
      await deleteClass.mutateAsync(classId!);
      notify.success(t("notify.class.deleteSuccess"));
      navigate(`${prefix}/classes`);
    } catch {
      notify.error(t("notify.class.deleteFailed"));
    }
  };

  if (classError) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-destructive">
          {t("common.loadError")}
        </div>
      </div>
    );
  }

  if (classLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-96 mb-8" />
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* 返回按钮 */}
      <Button variant="ghost" asChild className="mb-4">
        <Link to={`${prefix}/classes`}>
          <FiArrowLeft className="mr-2 h-4 w-4" />
          {t("classPage.backToList")}
        </Link>
      </Button>

      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {classData?.name}
          </h1>
          <p className="mt-1 text-muted-foreground">{classData?.description}</p>
        </div>
        <div className="flex gap-3">
          {/* 导出按钮 - 教师和课代表可见 */}
          {canExport && (
            <Button
              variant="outline"
              onClick={handleExportReport}
              disabled={isExporting}
            >
              <FiDownload className="mr-2 h-4 w-4" />
              {isExporting
                ? t("classPage.exporting")
                : t("classPage.exportReport")}
            </Button>
          )}
          {/* 教师专属按钮 */}
          {isTeacher && (
            <>
              <Button variant="outline" asChild>
                <Link to={`${prefix}/classes/${classId}/students`}>
                  <FiUsers className="mr-2 h-4 w-4" />
                  {t("classPage.studentManagement")}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={`${prefix}/classes/${classId}/edit`}>
                  <FiEdit2 className="mr-2 h-4 w-4" />
                  {t("classPage.edit")}
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <FiTrash2 className="mr-2 h-4 w-4" />
                    {t("classPage.delete")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("classPage.deleteConfirm.title")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("classPage.deleteConfirm.description")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {t("classPage.deleteConfirm.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteClass}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t("classPage.deleteConfirm.confirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 作业列表 */}
        <div className="lg:col-span-2">
          <HomeworkListCard
            classId={classId!}
            isTeacher={isTeacher}
            basePath={`${prefix}/classes/${classId}`}
          />
        </div>

        {/* 班级信息 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("classPage.classInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("classPage.teacher")}
                </p>
                <p className="font-medium">
                  {classData?.teacher?.display_name ||
                    classData?.teacher?.username}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("classPage.memberCount")}
                </p>
                <p className="font-medium">
                  {classData?.member_count} {t("classPage.memberUnit")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("classPage.createdAt")}
                </p>
                <p className="font-medium">
                  {classData?.created_at &&
                    new Date(classData.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {isTeacher && classData?.invite_code && (
            <Card>
              <CardHeader>
                <CardTitle>{t("classPage.inviteCode")}</CardTitle>
                <CardDescription>
                  {t("classPage.inviteCodeDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 rounded bg-muted font-mono text-lg">
                    {classData.invite_code}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyInviteCode}
                  >
                    <FiCopy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
