import { useTranslation } from "react-i18next";
import {
  FiBookOpen,
  FiChevronRight,
  FiClipboard,
  FiEdit,
  FiPlus,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import { Link } from "react-router";
import { PageHeader, StatCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useClassList } from "@/features/class/hooks/useClass";
import { useCurrentUser } from "@/stores/useUserStore";

export function TeacherDashboardPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const { data: classData, isLoading } = useClassList();

  const classes = classData?.items ?? [];
  const totalStudents = classes.reduce(
    (sum, cls) => sum + Number(cls.member_count ?? 0),
    0,
  );

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        titleKey="dashboard.teacher.title"
        descriptionKey="dashboard.teacher.welcome"
        descriptionParams={{ name: user?.display_name || user?.username || "" }}
        actions={
          <Button asChild>
            <Link to="/teacher/classes/create">
              <FiPlus className="mr-2 h-4 w-4" />
              {t("common.create")}
            </Link>
          </Button>
        }
      />

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <StatCard
          icon={FiBookOpen}
          labelKey="dashboard.teacher.stats.managedClasses"
          value={classes.length}
          variant="blue"
        />
        <StatCard
          icon={FiUsers}
          labelKey="dashboard.teacher.stats.totalStudents"
          value={totalStudents}
          variant="green"
        />
        <StatCard
          icon={FiClipboard}
          labelKey="dashboard.teacher.stats.quickActions"
          value={t("common.manage")}
          variant="purple"
          href="/teacher/classes"
        />
      </div>

      {/* 班级列表 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("dashboard.teacher.recentClasses")}</CardTitle>
          <Button variant="link" asChild className="p-0 h-auto">
            <Link to="/teacher/classes" className="flex items-center gap-1">
              {t("common.viewAll")}
              <FiChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
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
              <FiBookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {t("dashboard.teacher.emptyClasses")}
              </p>
              <Button asChild>
                <Link to="/teacher/classes/create">
                  <FiPlus className="mr-2 h-4 w-4" />
                  {t("common.create")}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="p-6 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {cls.name.charAt(0)}
                      </div>
                      <div>
                        <Link
                          to={`/teacher/classes/${cls.id}`}
                          className="text-base font-medium hover:text-primary transition-colors"
                        >
                          {cls.name}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {cls.description || t("common.noData")}
                          <span className="mx-2">·</span>
                          {cls.member_count ?? 0} {t("common.user")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          to={`/teacher/classes/${cls.id}/students`}
                          title={t("sidebar.studentManagement")}
                        >
                          <FiUserPlus className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          to={`/teacher/classes/${cls.id}/edit`}
                          title={t("common.edit")}
                        >
                          <FiEdit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/teacher/classes/${cls.id}`}>
                          <FiChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
