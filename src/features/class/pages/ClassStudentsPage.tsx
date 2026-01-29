import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiArrowLeft,
  FiCopy,
  FiMoreVertical,
  FiSearch,
  FiShield,
  FiUser,
  FiUserMinus,
  FiUsers,
} from "react-icons/fi";
import { Link, useParams } from "react-router";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  useClass,
  useClassMembers,
  useRemoveMember,
  useUpdateMemberRole,
} from "../hooks/useClass";
import { useRoutePrefix } from "../hooks/useClassBasePath";

const roleOrder: Record<string, number> = {
  teacher: 0,
  class_representative: 1,
  student: 2,
};

export function ClassStudentsPage() {
  const { t } = useTranslation();
  const { classId } = useParams<{ classId: string }>();
  const prefix = useRoutePrefix();
  const { data: classData } = useClass(classId!);

  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const { search, setSearch, debouncedSearch } = useDebouncedSearch({
    onSearchChange: () => setPage(1),
  });

  const queryParams = useMemo(() => {
    const params: {
      page: number;
      page_size: number;
      search?: string;
      role?: string;
    } = {
      page,
      page_size: pageSize,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (roleFilter !== "all") params.role = roleFilter;
    return params;
  }, [page, pageSize, debouncedSearch, roleFilter]);

  const {
    data: membersData,
    isLoading,
    error,
  } = useClassMembers(classId!, queryParams);
  const updateRole = useUpdateMemberRole(classId!);
  const removeMember = useRemoveMember(classId!);

  const sortedMembers = useMemo(() => {
    if (!membersData?.items) return [];
    return [...membersData.items].sort(
      (a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9),
    );
  }, [membersData]);

  const handleSetRole = async (
    userId: string,
    role: "student" | "class_representative",
  ) => {
    try {
      await updateRole.mutateAsync({ userId, role });
      notify.success(t("notify.member.roleUpdated"));
    } catch (error) {
      logger.error("Failed to update member role", error);
      notify.error(t("notify.member.operationFailed"));
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    try {
      await removeMember.mutateAsync(selectedMember.id);
      notify.success(t("notify.member.removed"));
      setRemoveDialogOpen(false);
      setSelectedMember(null);
    } catch (error) {
      logger.error("Failed to remove member", error);
      notify.error(t("notify.member.operationFailed"));
    }
  };

  const handleCopyInviteCode = async () => {
    if (!classData?.invite_code) return;
    try {
      await navigator.clipboard.writeText(classData.invite_code);
      notify.success(t("notify.class.inviteCodeCopied"));
    } catch (error) {
      logger.error("Failed to copy invite code", error);
      notify.error(t("common.copyFailed"));
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "teacher":
        return (
          <Badge variant="default">{t("studentsPage.roles.teacher")}</Badge>
        );
      case "class_representative":
        return (
          <Badge variant="secondary">
            {t("studentsPage.roles.representative")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">{t("studentsPage.roles.student")}</Badge>
        );
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-destructive">
          {t("common.loadError")}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 返回按钮 */}
      <Button variant="ghost" asChild>
        <Link to={`${prefix}/classes/${classId}`}>
          <FiArrowLeft className="mr-2 h-4 w-4" />
          {t("studentsPage.backToDetail")}
        </Link>
      </Button>

      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("studentsPage.title")}</h1>
          <p className="text-muted-foreground">{classData?.name}</p>
        </div>
        {classData?.invite_code && (
          <div className="flex items-center gap-2">
            <code className="bg-muted px-2 py-1 rounded text-sm">
              {classData.invite_code}
            </code>
            <Button variant="outline" size="sm" onClick={handleCopyInviteCode}>
              <FiCopy className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* 统计条 */}
      {!isLoading && membersData?.pagination && (
        <div className="flex flex-wrap gap-3">
          <Badge variant="secondary">
            <FiUsers className="mr-1 h-3 w-3" />
            {t("studentsPage.memberCount", {
              count: Number(membersData.pagination.total),
            })}
          </Badge>
        </div>
      )}

      {/* 工具栏 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("studentsPage.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(v) => {
                setRoleFilter(v);
                setPage(1); // 筛选变化时重置页码
              }}
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("studentsPage.filterAll")}
                </SelectItem>
                <SelectItem value="teacher">
                  {t("studentsPage.filterTeacher")}
                </SelectItem>
                <SelectItem value="class_representative">
                  {t("studentsPage.filterRepresentative")}
                </SelectItem>
                <SelectItem value="student">
                  {t("studentsPage.filterStudent")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 表格 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("studentsPage.tableHeader.name")}</TableHead>
                <TableHead>{t("studentsPage.tableHeader.username")}</TableHead>
                <TableHead>{t("studentsPage.tableHeader.role")}</TableHead>
                <TableHead>{t("studentsPage.tableHeader.joinedAt")}</TableHead>
                <TableHead className="text-right">
                  {t("studentsPage.tableHeader.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))
              ) : sortedMembers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FiUsers className="h-8 w-8" />
                      <span>{t("studentsPage.noMembers")}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={member.user?.avatar_url || undefined}
                          />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {(member.user.display_name ||
                              member.user.username ||
                              "?")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {member.user.display_name || member.user.username}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      @{member.user.username}
                    </TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.joined_at
                        ? new Date(member.joined_at).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.role !== "teacher" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <FiMoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {member.role === "student" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleSetRole(
                                    member.user.id,
                                    "class_representative",
                                  )
                                }
                              >
                                <FiShield className="mr-2 h-4 w-4" />
                                {t("studentsPage.actions.setRepresentative")}
                              </DropdownMenuItem>
                            )}
                            {member.role === "class_representative" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleSetRole(member.user.id, "student")
                                }
                              >
                                <FiUser className="mr-2 h-4 w-4" />
                                {t("studentsPage.actions.removeRepresentative")}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedMember({
                                  id: member.user.id,
                                  name:
                                    member.user.display_name ||
                                    member.user.username ||
                                    "",
                                });
                                setRemoveDialogOpen(true);
                              }}
                            >
                              <FiUserMinus className="mr-2 h-4 w-4" />
                              {t("studentsPage.actions.removeMember")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 分页 */}
      {membersData && (
        <Pagination
          current={page}
          total={Number(membersData.pagination.total)}
          pageSize={pageSize}
          pageSizeOptions={TABLE_PAGE_SIZE_OPTIONS}
          onChange={(newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          }}
          showTotal
          showSizeChanger
        />
      )}

      {/* 移除确认对话框 */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("studentsPage.removeDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("studentsPage.removeDialog.description", {
                name: selectedMember?.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("studentsPage.removeDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("studentsPage.removeDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
