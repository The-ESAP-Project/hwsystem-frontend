import { useEffect, useMemo, useState } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  const { classId } = useParams<{ classId: string }>();
  const prefix = useRoutePrefix();
  const { data: classData } = useClass(classId!);

  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo(() => {
    const params: { page_size: number; search?: string; role?: string } = {
      page_size: 200,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (roleFilter !== "all") params.role = roleFilter;
    return params;
  }, [debouncedSearch, roleFilter]);

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
      notify.success("角色已更新");
    } catch {
      notify.error("操作失败");
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    try {
      await removeMember.mutateAsync(selectedMember.id);
      notify.success("成员已移除");
      setRemoveDialogOpen(false);
      setSelectedMember(null);
    } catch {
      notify.error("操作失败");
    }
  };

  const handleCopyInviteCode = async () => {
    if (!classData?.invite_code) return;
    try {
      await navigator.clipboard.writeText(classData.invite_code);
      notify.success("邀请码已复制");
    } catch {
      notify.error("复制失败");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "teacher":
        return <Badge variant="default">教师</Badge>;
      case "class_representative":
        return <Badge variant="secondary">课代表</Badge>;
      default:
        return <Badge variant="outline">学生</Badge>;
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-destructive">加载失败，请刷新重试</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 返回按钮 */}
      <Button variant="ghost" asChild>
        <Link to={`${prefix}/classes/${classId}`}>
          <FiArrowLeft className="mr-2 h-4 w-4" />
          返回班级详情
        </Link>
      </Button>

      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">学生管理</h1>
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
            {membersData.pagination.total} 人
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
                placeholder="搜索姓名或用户名..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部角色</SelectItem>
                <SelectItem value="teacher">教师</SelectItem>
                <SelectItem value="class_representative">课代表</SelectItem>
                <SelectItem value="student">学生</SelectItem>
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
                <TableHead>姓名</TableHead>
                <TableHead>用户名</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>加入时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
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
                      <span>暂无成员</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
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
                        ? new Date(member.joined_at).toLocaleDateString("zh-CN")
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
                                设为课代表
                              </DropdownMenuItem>
                            )}
                            {member.role === "class_representative" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleSetRole(member.user.id, "student")
                                }
                              >
                                <FiUser className="mr-2 h-4 w-4" />
                                取消课代表
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
                              移除成员
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

      {/* 移除确认对话框 */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认移除成员？</AlertDialogTitle>
            <AlertDialogDescription>
              确定要将 {selectedMember?.name}{" "}
              从班级中移除吗？移除后，该成员的提交记录将保留，但无法再访问班级内容。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              移除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
