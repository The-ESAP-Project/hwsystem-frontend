import { useState } from "react";
import { FiBook, FiCalendar, FiLogIn, FiPlus, FiUsers } from "react-icons/fi";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermission } from "@/features/auth/hooks/usePermission";
import { notify } from "@/stores/useNotificationStore";
import { useClassList, useJoinClass } from "../hooks/useClass";

export function ClassListPage() {
  const { data, isLoading, error } = useClassList();
  const { canCreateClass } = usePermission();
  const joinClass = useJoinClass();
  const [inviteCode, setInviteCode] = useState("");
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

  const handleJoinClass = async () => {
    if (!inviteCode.trim()) {
      notify.warning("请输入邀请码");
      return;
    }
    try {
      await joinClass.mutateAsync(inviteCode.trim());
      notify.success("加入班级成功");
      setInviteCode("");
      setIsJoinDialogOpen(false);
    } catch {
      notify.error("加入失败", "邀请码无效或已加入该班级");
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-destructive">加载失败，请刷新重试</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">我的班级</h1>
          <p className="mt-1 text-muted-foreground">管理和查看所有班级</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FiLogIn className="mr-2 h-4 w-4" />
                加入班级
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>加入班级</DialogTitle>
                <DialogDescription>输入班级邀请码加入班级</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="请输入邀请码"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinClass()}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsJoinDialogOpen(false)}
                >
                  取消
                </Button>
                <Button
                  onClick={handleJoinClass}
                  disabled={joinClass.isPending}
                >
                  {joinClass.isPending ? "加入中..." : "加入"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {canCreateClass && (
            <Button asChild>
              <Link to="/teacher/classes/create">
                <FiPlus className="mr-2 h-4 w-4" />
                创建班级
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* 班级列表 */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FiBook className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">
              暂无班级
            </h3>
            <p className="mt-2 text-muted-foreground">
              {canCreateClass
                ? '点击"创建班级"开始创建你的第一个班级'
                : '点击"加入班级"使用邀请码加入班级'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((cls) => (
            <Link key={cls.id} to={`/user/classes/${cls.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FiBook className="h-5 w-5 text-primary" />
                    {cls.name}
                  </CardTitle>
                  <CardDescription>{cls.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <FiUsers className="h-4 w-4" />
                      <span>{cls.member_count} 名成员</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">教师：</span>
                      <span>
                        {cls.teacher?.display_name || cls.teacher?.username}
                      </span>
                    </div>
                    {cls.my_role && (
                      <div className="flex items-center gap-2">
                        <FiCalendar className="h-4 w-4" />
                        <span>
                          身份：
                          {cls.my_role === "teacher"
                            ? "教师"
                            : cls.my_role === "class_representative"
                              ? "课代表"
                              : "学生"}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
