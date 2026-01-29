import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiDownload,
  FiEdit2,
  FiEye,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUpload,
  FiUserMinus,
} from "react-icons/fi";
import { Link } from "react-router";
import { BatchActionBar } from "@/components/common/BatchActionBar";
import { Pagination } from "@/components/common/Pagination";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { DEFAULT_PAGE_SIZE, TABLE_PAGE_SIZE_OPTIONS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { notify } from "@/stores/useNotificationStore";
import { UserExportDialog } from "../components/UserExportDialog";
import { UserImportDialog } from "../components/UserImportDialog";
import { type UserDetail, useDeleteUser, useUserList } from "../hooks/useUsers";
import type { UserRole, UserStatus } from "../services/userService";

const roleColors: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  teacher: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  user: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const statusColors: Record<UserStatus, string> = {
  active:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  suspended:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  banned: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function UserListPage() {
  const { t } = useTranslation();

  const roleLabels: Record<UserRole, string> = {
    admin: t("role.admin"),
    teacher: t("role.teacher"),
    user: t("role.student"),
  };

  const statusLabels: Record<UserStatus, string> = {
    active: t("status.active"),
    suspended: t("status.suspended"),
    banned: t("status.banned"),
  };

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [deleteTarget, setDeleteTarget] = useState<UserDetail | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // 批量选择状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { search, setSearch, debouncedSearch } = useDebouncedSearch({
    onSearchChange: () => setPage(1),
  });

  const { data, isLoading, error } = useUserList({
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined,
    role: roleFilter === "all" ? undefined : roleFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const deleteUser = useDeleteUser();

  // 批量选择相关函数
  const items = data?.items ?? [];

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds],
  );

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map((item) => item.id)));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isAllSelected = useMemo(
    () => items.length > 0 && selectedIds.size === items.length,
    [items.length, selectedIds.size],
  );

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    // 显示确认对话框后批量删除
    const count = selectedIds.size;
    try {
      for (const id of selectedIds) {
        await deleteUser.mutateAsync(id);
      }
      notify.success(t("notify.user.batchDeleteSuccess", { count }));
      clearSelection();
    } catch (error) {
      logger.error("Failed to batch delete users", error);
      notify.error(t("notify.user.batchDeleteFailed"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteUser.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  // 分页变化
  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
    clearSelection(); // 切换页面时清空选择
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              {t("common.loadError")}: {error.message}
            </p>
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
          <h1 className="text-2xl font-bold">{t("userList.title")}</h1>
          <p className="text-muted-foreground">{t("userList.description")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
            <FiDownload className="mr-2 h-4 w-4" />
            {t("userList.export")}
          </Button>
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <FiUpload className="mr-2 h-4 w-4" />
            {t("userList.import")}
          </Button>
          <Button asChild>
            <Link to="/admin/users/create">
              <FiPlus className="mr-2 h-4 w-4" />
              {t("userForm.createUser")}
            </Link>
          </Button>
        </div>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("userList.filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 max-w-sm">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("userList.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={roleFilter}
              onValueChange={(v) => {
                setRoleFilter(v as UserRole | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t("userForm.role")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("userList.allRoles")}</SelectItem>
                <SelectItem value="admin">{t("role.admin")}</SelectItem>
                <SelectItem value="teacher">{t("role.teacher")}</SelectItem>
                <SelectItem value="user">{t("role.student")}</SelectItem>
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
                <SelectValue placeholder={t("userForm.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("userList.allStatuses")}</SelectItem>
                <SelectItem value="active">{t("status.active")}</SelectItem>
                <SelectItem value="suspended">
                  {t("status.suspended")}
                </SelectItem>
                <SelectItem value="banned">{t("status.banned")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 批量操作栏 */}
      <BatchActionBar
        selectedCount={selectedIds.size}
        totalCount={items.length}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
        isAllSelected={isAllSelected}
        actions={[
          {
            label: t("userList.batchDelete"),
            icon: <FiUserMinus className="h-4 w-4" />,
            onClick: handleBatchDelete,
            variant: "destructive",
          },
        ]}
      />

      {/* 用户表格 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        selectAll();
                      } else {
                        clearSelection();
                      }
                    }}
                    aria-label={t("common.selectAll")}
                  />
                </TableHead>
                <TableHead>{t("userForm.username")}</TableHead>
                <TableHead>{t("userForm.email")}</TableHead>
                <TableHead>{t("userForm.displayName")}</TableHead>
                <TableHead>{t("userForm.role")}</TableHead>
                <TableHead>{t("userForm.status")}</TableHead>
                <TableHead>{t("userDetail.createdAt")}</TableHead>
                <TableHead className="text-right">
                  {t("common.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
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
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {t("userList.noData")}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((user) => (
                  <TableRow
                    key={user.id}
                    className={isSelected(user.id) ? "bg-muted/50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected(user.id)}
                        onCheckedChange={() => toggleSelection(user.id)}
                        aria-label={`选择 ${user.username}`}
                      />
                    </TableCell>
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
      {data && (
        <Pagination
          current={page}
          total={Number(data.pagination.total)}
          pageSize={pageSize}
          pageSizeOptions={TABLE_PAGE_SIZE_OPTIONS}
          onChange={handlePageChange}
          showTotal
          showSizeChanger
        />
      )}

      {/* 删除确认对话框 */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("userDetail.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("userDetail.deleteWarning", {
                username: deleteTarget?.username,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteUser.isPending
                ? t("common.deleting")
                : t("common.confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 导入用户对话框 */}
      <UserImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />

      {/* 导出用户对话框 */}
      <UserExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        currentFilters={{
          role: roleFilter,
          status: statusFilter,
          search: debouncedSearch,
        }}
      />
    </div>
  );
}
