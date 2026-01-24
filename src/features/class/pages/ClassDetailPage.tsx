import {
  FiArrowLeft,
  FiCopy,
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

export function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const { canManageClass } = usePermission();
  const prefix = useRoutePrefix();

  const {
    data: classData,
    isLoading: classLoading,
    error: classError,
  } = useClass(classId!);
  const deleteClass = useDeleteClass();

  const isTeacher = classData?.teacher?.id === user?.id || canManageClass;

  const handleCopyInviteCode = () => {
    if (classData?.invite_code) {
      navigator.clipboard.writeText(classData.invite_code);
      notify.success("已复制邀请码");
    }
  };

  const handleDeleteClass = async () => {
    try {
      await deleteClass.mutateAsync(classId!);
      notify.success("班级已删除");
      navigate(`${prefix}/classes`);
    } catch {
      notify.error("删除失败");
    }
  };

  if (classError) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-destructive">加载失败，请刷新重试</div>
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
          返回班级列表
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
        {isTeacher && (
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to={`${prefix}/classes/${classId}/students`}>
                <FiUsers className="mr-2 h-4 w-4" />
                学生管理
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`${prefix}/classes/${classId}/edit`}>
                <FiEdit2 className="mr-2 h-4 w-4" />
                编辑
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <FiTrash2 className="mr-2 h-4 w-4" />
                  删除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认删除班级？</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作不可撤销。删除后，所有作业、提交和成绩数据都将被永久删除。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteClass}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
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
              <CardTitle>班级信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">教师</p>
                <p className="font-medium">
                  {classData?.teacher?.display_name ||
                    classData?.teacher?.username}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">成员数量</p>
                <p className="font-medium">{classData?.member_count} 人</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">创建时间</p>
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
                <CardTitle>邀请码</CardTitle>
                <CardDescription>分享给学生加入班级</CardDescription>
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
