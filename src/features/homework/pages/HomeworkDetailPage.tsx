import {
  FiArrowLeft,
  FiBarChart2,
  FiClock,
  FiEdit2,
  FiPaperclip,
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
import { useMyLatestSubmission } from "@/features/submission/hooks/useSubmission";
import { notify } from "@/stores/useNotificationStore";
import { useCurrentUser } from "@/stores/useUserStore";
import { useDeleteHomework, useHomework } from "../hooks/useHomework";

export function HomeworkDetailPage() {
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
  const isDeadlinePassed = homework?.deadline
    ? new Date(homework.deadline) < new Date()
    : false;
  const canSubmit = !isDeadlinePassed || homework?.allow_late_submission;

  const handleDelete = async () => {
    try {
      await deleteHomework.mutateAsync(homeworkId!);
      notify.success("作业已删除");
      navigate(`${prefix}/classes/${classId}`);
    } catch {
      notify.error("删除失败");
    }
  };

  const getStatusBadge = () => {
    if (!homework?.deadline) return null;
    const deadline = new Date(homework.deadline);
    const now = new Date();
    if (now > deadline) {
      return <Badge variant="destructive">已截止</Badge>;
    }
    const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursLeft < 24) {
      return <Badge variant="secondary">即将截止</Badge>;
    }
    return <Badge variant="default">进行中</Badge>;
  };

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-destructive">加载失败，请刷新重试</div>
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
          返回班级
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
                    满分 {homework?.max_score} 分
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge()}
                  {isTeacherView && hasTeacherPermission && (
                    <>
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          to={`${prefix}/classes/${classId}/homework/${homeworkId}/edit`}
                        >
                          <FiEdit2 className="mr-2 h-4 w-4" />
                          编辑
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <FiTrash2 className="mr-2 h-4 w-4" />
                            删除
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除作业？</AlertDialogTitle>
                            <AlertDialogDescription>
                              删除后，所有学生的提交记录和成绩都将被永久删除。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDelete}
                              className="bg-destructive text-destructive-foreground"
                            >
                              删除
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
                  {homework?.description || "暂无作业描述"}
                </p>
              </div>

              {/* 附件 */}
              {homework?.attachments && homework.attachments.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    <FiPaperclip className="inline-block mr-2 h-4 w-4" />
                    附件
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
                <CardTitle>我的提交</CardTitle>
              </CardHeader>
              <CardContent>
                {mySubmission ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          第 {mySubmission.version} 次提交
                        </p>
                        <p className="text-sm text-muted-foreground">
                          提交于{" "}
                          {new Date(mySubmission.submitted_at).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        {mySubmission.grade ? (
                          <Badge variant="default">
                            {mySubmission.grade.score} / {homework?.max_score}{" "}
                            分
                          </Badge>
                        ) : (
                          <Badge variant="secondary">待批改</Badge>
                        )}
                      </div>
                    </div>
                    {mySubmission.grade?.comment && (
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-sm text-muted-foreground">
                          教师评语
                        </p>
                        <p className="mt-1">{mySubmission.grade.comment}</p>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <Button variant="outline" asChild>
                        <Link
                          to={`${prefix}/homework/${homeworkId}/submissions`}
                        >
                          查看提交历史
                        </Link>
                      </Button>
                      {canSubmit && (
                        <Button asChild>
                          <Link
                            to={`${prefix}/classes/${classId}/homework/${homeworkId}/submit`}
                          >
                            <FiUpload className="mr-2 h-4 w-4" />
                            重新提交
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">
                      你还没有提交作业
                    </p>
                    {canSubmit ? (
                      <Button asChild>
                        <Link
                          to={`${prefix}/classes/${classId}/homework/${homeworkId}/submit`}
                        >
                          <FiUpload className="mr-2 h-4 w-4" />
                          提交作业
                        </Link>
                      </Button>
                    ) : (
                      <p className="text-sm text-destructive">
                        作业已截止，无法提交
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
              <CardTitle>作业信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {homework?.creator && (
                <div>
                  <p className="text-sm text-muted-foreground">创建者</p>
                  <p className="font-medium">
                    {homework.creator.display_name || homework.creator.username}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <FiClock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">截止时间</p>
                  <p className="font-medium">
                    {homework?.deadline
                      ? new Date(homework.deadline).toLocaleString()
                      : "无截止时间"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">允许迟交</p>
                <p className="font-medium">
                  {homework?.allow_late_submission ? "是" : "否"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">附件数量</p>
                <p className="font-medium">
                  {homework?.attachments?.length || 0} 个
                </p>
              </div>
            </CardContent>
          </Card>

          {isTeacherView && (
            <Card>
              <CardHeader>
                <CardTitle>教师操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full" asChild>
                  <Link
                    to={`${prefix}/classes/${classId}/homework/${homeworkId}/submissions`}
                  >
                    <FiBarChart2 className="mr-2 h-4 w-4" />
                    查看提交
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link
                    to={`${prefix}/classes/${classId}/homework/${homeworkId}/stats`}
                  >
                    <FiBarChart2 className="mr-2 h-4 w-4" />
                    作业统计
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
