import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEye, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClassList, useDeleteClass } from "@/features/class/hooks/useClass";
import type { ClassDetailStringified } from "@/features/class/services/classService";

export default function ClassManagementPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deleteTarget, setDeleteTarget] =
    useState<ClassDetailStringified | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error } = useClassList({
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined,
  });

  const deleteClass = useDeleteClass();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteClass.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              {t("admin.classes.loadError")}: {error.message}
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
          <h1 className="text-2xl font-bold">{t("admin.classes.title")}</h1>
          <p className="text-muted-foreground">{t("admin.classes.subtitle")}</p>
        </div>
        <Button asChild>
          <Link to="/admin/classes/create">
            <FiPlus className="mr-2 h-4 w-4" />
            {t("admin.classes.create")}
          </Link>
        </Button>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("admin.classes.filter")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("admin.classes.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* 班级表格 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.classes.columns.name")}</TableHead>
                <TableHead>{t("admin.classes.columns.teacher")}</TableHead>
                <TableHead>{t("admin.classes.columns.members")}</TableHead>
                <TableHead>{t("admin.classes.columns.inviteCode")}</TableHead>
                <TableHead>{t("admin.classes.columns.createdAt")}</TableHead>
                <TableHead className="text-right">
                  {t("admin.classes.columns.actions")}
                </TableHead>
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
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-16 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data?.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {t("admin.classes.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>
                      {cls.teacher?.display_name ||
                        cls.teacher?.username ||
                        "-"}
                    </TableCell>
                    <TableCell>{cls.member_count}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {cls.invite_code || "-"}
                      </code>
                    </TableCell>
                    <TableCell>
                      {cls.created_at
                        ? new Date(cls.created_at).toLocaleDateString("zh-CN")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-xs" asChild>
                          <Link to={`/admin/classes/${cls.id}`}>
                            <FiEye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeleteTarget(cls)}
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
      {data?.pagination && (
        <Pagination
          current={page}
          total={Number(data.pagination.total)}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 50]}
          onChange={(newPage, newPageSize) => {
            if (newPageSize !== pageSize) {
              setPageSize(newPageSize);
              setPage(1);
            } else {
              setPage(newPage);
            }
          }}
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
            <AlertDialogTitle>
              {t("admin.classes.deleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.classes.deleteConfirmDesc", {
                name: deleteTarget?.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteClass.isPending
                ? t("admin.classes.deleting")
                : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
