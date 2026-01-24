import { useState } from "react";
import {
  FiArrowLeft,
  FiMoreVertical,
  FiShield,
  FiUser,
  FiUserMinus,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { notify } from "@/stores/useNotificationStore";
import {
  useClass,
  useClassMembers,
  useRemoveMember,
  useUpdateMemberRole,
} from "../hooks/useClass";

export function ClassStudentsPage() {
  const { classId } = useParams<{ classId: string }>();
  const { data: classData } = useClass(classId!);
  const { data: membersData, isLoading, error } = useClassMembers(classId!);
  const updateRole = useUpdateMemberRole(classId!);
  const removeMember = useRemoveMember(classId!);

  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{
    id: string;
    name: string;
  } | null>(null);

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
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-destructive">加载失败，请刷新重试</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link to={`/user/classes/${classId}`}>
          <FiArrowLeft className="mr-2 h-4 w-4" />
          返回班级详情
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>学生管理 - {classData?.name}</CardTitle>
          <CardDescription>管理班级成员和角色</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : membersData?.items.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>暂无成员</p>
            </div>
          ) : (
            <div className="space-y-2">
              {membersData?.items.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {(member.user.display_name ||
                          member.user.username ||
                          "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">
                        {member.user.display_name || member.user.username}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{member.user.username}
                        {member.joined_at &&
                          ` · 加入于 ${new Date(member.joined_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getRoleBadge(member.role)}
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
