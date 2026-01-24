import { useState } from "react";
import {
  FiArrowLeft,
  FiClock,
  FiEdit2,
  FiMail,
  FiShield,
  FiTrash2,
  FiUser,
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteUser, useUser } from "../hooks/useUsers";
import type { UserRole, UserStatus } from "../services/userService";

const roleLabels: Record<UserRole, string> = {
  admin: "管理员",
  teacher: "教师",
  user: "用户",
};

const roleColors: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  teacher: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  user: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const statusLabels: Record<UserStatus, string> = {
  active: "正常",
  suspended: "暂停",
  banned: "封禁",
};

const statusColors: Record<UserStatus, string> = {
  active:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  suspended:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  banned: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: user, isLoading, error } = useUser(userId);
  const deleteUser = useDeleteUser();

  const handleDelete = async () => {
    if (!userId) return;
    await deleteUser.mutateAsync(userId);
    navigate("/admin/users");
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              {error ? `加载失败: ${error.message}` : "用户不存在"}
            </p>
            <Button className="mt-4" onClick={() => navigate("/admin/users")}>
              返回用户列表
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <FiArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {user.display_name || user.username}
              </h1>
              <Badge variant="outline" className={roleColors[user.role]}>
                {roleLabels[user.role]}
              </Badge>
              <Badge variant="outline" className={statusColors[user.status]}>
                {statusLabels[user.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">@{user.username}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/admin/users/${userId}/edit`}>
              <FiEdit2 className="mr-2 h-4 w-4" />
              编辑
            </Link>
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <FiTrash2 className="mr-2 h-4 w-4" />
            删除
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiUser className="h-5 w-5" />
              基本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">用户 ID</span>
              <span className="font-mono text-sm">{user.id}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">用户名</span>
              <span>{user.username}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">显示名</span>
              <span>{user.display_name || "-"}</span>
            </div>
          </CardContent>
        </Card>

        {/* 联系方式 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiMail className="h-5 w-5" />
              联系方式
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">邮箱</span>
              <span>{user.email}</span>
            </div>
          </CardContent>
        </Card>

        {/* 权限信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiShield className="h-5 w-5" />
              权限信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">角色</span>
              <Badge variant="outline" className={roleColors[user.role]}>
                {roleLabels[user.role]}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">状态</span>
              <Badge variant="outline" className={statusColors[user.status]}>
                {statusLabels[user.status]}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 时间信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiClock className="h-5 w-5" />
              时间信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">创建时间</span>
              <span>{new Date(user.created_at).toLocaleString("zh-CN")}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">更新时间</span>
              <span>{new Date(user.updated_at).toLocaleString("zh-CN")}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">最后登录</span>
              <span>
                {user.last_login
                  ? new Date(user.last_login).toLocaleString("zh-CN")
                  : "从未登录"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除用户？</AlertDialogTitle>
            <AlertDialogDescription>
              即将删除用户 <strong>{user.username}</strong>，此操作不可撤销。
              删除后该用户将无法登录系统。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteUser.isPending ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
