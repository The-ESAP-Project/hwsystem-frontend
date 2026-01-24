import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  FiBell,
  FiBookOpen,
  FiCheck,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiFileText,
  FiUsers,
} from "react-icons/fi";
import { Link } from "react-router";
import { PageHeader, StatCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useClassList } from "@/features/class/hooks/useClass";
import { useAllClassesHomeworks } from "@/features/homework/hooks/useHomework";
import { useUnreadCount } from "@/features/notification/hooks/useNotification";
import { useCurrentUser } from "@/stores/useUserStore";

export function UserDashboardPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const { data: classData, isLoading: classLoading } = useClassList();
  const { data: unreadData } = useUnreadCount();

  const classes = classData?.items ?? [];
  const unreadCount = unreadData?.unread_count ?? 0;

  // 获取所有班级的作业
  const classIds = useMemo(() => classes.map((c) => String(c.id)), [classes]);
  const { data: allHomeworks, isLoading: homeworksLoading } =
    useAllClassesHomeworks(classIds);

  // 计算作业统计
  const homeworkStats = useMemo(() => {
    const pending = allHomeworks.filter((hw) => !hw.my_submission);
    const submitted = allHomeworks.filter(
      (hw) =>
        hw.my_submission &&
        (hw.my_submission.status === "pending" ||
          hw.my_submission.status === "late"),
    );
    const graded = allHomeworks.filter(
      (hw) => hw.my_submission?.status === "graded",
    );

    // 待完成作业按截止日期排序（最近的在前，无截止日期的在最后）
    const sortedPending = [...pending].sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

    return {
      pending: pending.length,
      submitted: submitted.length,
      graded: graded.length,
      upcomingHomeworks: sortedPending.slice(0, 5),
    };
  }, [allHomeworks]);

  // 格式化截止日期
  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return t("dashboard.user.noDeadline");
    const date = new Date(deadline);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) {
      return `${t("dashboard.user.deadline")}: ${Math.abs(days)} 天前`;
    } else if (days === 0) {
      return `${t("dashboard.user.deadline")}: 今天`;
    } else if (days === 1) {
      return `${t("dashboard.user.deadline")}: 明天`;
    } else if (days <= 7) {
      return `${t("dashboard.user.deadline")}: ${days} 天后`;
    } else {
      return `${t("dashboard.user.deadline")}: ${date.toLocaleDateString()}`;
    }
  };

  // 获取班级名称
  const getClassName = (classId: string) => {
    const cls = classes.find((c) => String(c.id) === classId);
    return cls?.name ?? "";
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        titleKey="dashboard.user.title"
        descriptionKey="dashboard.user.welcome"
        descriptionParams={{ name: user?.display_name || user?.username || "" }}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/notifications" className="relative">
                <FiBell className="mr-2 h-4 w-4" />
                {t("common.notifications")}
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            </Button>
            <Button asChild>
              <Link to="/user/classes">
                <FiBookOpen className="mr-2 h-4 w-4" />
                {t("sidebar.myClasses")}
              </Link>
            </Button>
          </>
        }
      />

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6 mb-8">
        <StatCard
          icon={FiBookOpen}
          labelKey="dashboard.user.stats.joinedClasses"
          value={classes.length}
          variant="blue"
        />
        <StatCard
          icon={FiClock}
          labelKey="dashboard.user.stats.pendingHomeworks"
          value={homeworksLoading ? "-" : homeworkStats.pending}
          variant="orange"
        />
        <StatCard
          icon={FiFileText}
          labelKey="dashboard.user.stats.submittedHomeworks"
          value={homeworksLoading ? "-" : homeworkStats.submitted}
          variant="purple"
        />
        <StatCard
          icon={FiCheckCircle}
          labelKey="dashboard.user.stats.gradedHomeworks"
          value={homeworksLoading ? "-" : homeworkStats.graded}
          variant="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 待完成作业列表 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("dashboard.user.pendingHomeworks")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {homeworksLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : homeworkStats.upcomingHomeworks.length === 0 ? (
              <div className="p-12 text-center">
                <FiCheck className="h-12 w-12 text-green-500/50 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {t("dashboard.user.allDone")}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {homeworkStats.upcomingHomeworks.map((hw) => (
                  <Link
                    key={hw.id}
                    to={`/user/classes/${hw.class_id}/homework/${hw.id}`}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shrink-0">
                        <FiFileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {hw.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {getClassName(String(hw.class_id))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          hw.deadline &&
                          new Date(hw.deadline).getTime() - Date.now() <
                            24 * 60 * 60 * 1000
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {formatDeadline(hw.deadline)}
                      </span>
                      <FiChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 我的班级列表 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("dashboard.user.myClasses")}</CardTitle>
            <Button variant="link" asChild className="p-0 h-auto">
              <Link to="/user/classes" className="flex items-center gap-1">
                {t("dashboard.user.viewAll")}
                <FiChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {classLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : classes.length === 0 ? (
              <div className="p-12 text-center">
                <FiUsers className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  {t("dashboard.user.emptyClasses")}
                </p>
                <p className="text-sm text-muted-foreground/70">
                  {t("dashboard.user.joinClassHint")}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {classes.slice(0, 5).map((cls) => (
                  <Link
                    key={cls.id}
                    to={`/user/classes/${cls.id}`}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold shrink-0">
                        {cls.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{cls.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {cls.teacher?.display_name ||
                            cls.teacher?.username ||
                            t("sidebar.teacher")}
                        </p>
                      </div>
                    </div>
                    <FiChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
