import { useState } from "react";
import { FiEdit2, FiEye, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type UserWithStringId,
  useDeleteUser,
  useUserList,
} from "../hooks/useUsers";
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

export default function UserListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [deleteTarget, setDeleteTarget] = useState<UserWithStringId | null>(
    null,
  );

  const { data, isLoading, error } = useUserList({
    page,
    page_size: 20,
    search: search || undefined,
    role: roleFilter === "all" ? undefined : roleFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const deleteUser = useDeleteUser();

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteUser.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">加载失败: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">用户管理</h1>
          <p className="text-muted-foreground">管理系统中的所有用户</p>
        </div>
        <Button asChild>
          <Link to="/admin/users/create">
            <FiPlus className="mr-2 h-4 w-4" />
            创建用户
          </Link>
        </Button>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="搜索用户名或邮箱..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="max-w-sm"
              />
              <Button variant="outline" onClick={handleSearch}>
                <FiSearch className="h-4 w-4" />
              </Button>
            </div>

            <Select
              value={roleFilter}
              onValueChange={(v) => {
                setRoleFilter(v as UserRole | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部角色</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
                <SelectItem value="teacher">教师</SelectItem>
                <SelectItem value="user">用户</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as UserStatus | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">正常</SelectItem>
                <SelectItem value="suspended">暂停</SelectItem>
                <SelectItem value="banned">封禁</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 用户表格 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户名</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>显示名</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-14" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-24 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data?.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    暂无用户数据
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.username}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.display_name || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={roleColors[user.role]}
                      >
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[user.status]}
                      >
                        {statusLabels[user.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString("zh-CN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-xs" asChild>
                          <Link to={`/admin/users/${user.id}`}>
                            <FiEye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon-xs" asChild>
                          <Link to={`/admin/users/${user.id}/edit`}>
                            <FiEdit2 className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeleteTarget(user)}
                        >
                          <FiTrash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 分页 */}
      {data && data.pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            共 {data.pagination.total} 条记录，第 {page} /{" "}
            {data.pagination.total_pages} 页
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((p) => Math.min(data.pagination.total_pages, p + 1))
              }
              disabled={page >= data.pagination.total_pages}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除用户？</AlertDialogTitle>
            <AlertDialogDescription>
              即将删除用户 <strong>{deleteTarget?.username}</strong>
              ，此操作不可撤销。 删除后该用户将无法登录系统。
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
