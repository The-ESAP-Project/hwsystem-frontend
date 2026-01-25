import { useTranslation } from "react-i18next";
import {
  FiBookOpen,
  FiChevronRight,
  FiPlus,
  FiSettings,
  FiShield,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import { Link } from "react-router";
import { PageHeader, StatCard } from "@/components/common";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserList } from "@/features/admin/hooks/useUsers";
import { useClassList } from "@/features/class/hooks/useClass";
import { useCurrentUser } from "@/stores/useUserStore";

export function AdminDashboardPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const { data: userData, isLoading: userLoading } = useUserList({
    page: 1,
    page_size: 5,
  });
  const { data: classData } = useClassList();

  const totalUsers = userData?.pagination?.total ?? 0;
  const recentUsers = userData?.items ?? [];
  const totalClasses = classData?.items?.length ?? 0;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        titleKey="dashboard.admin.title"
        descriptionKey="dashboard.admin.welcome"
        descriptionParams={{ name: user?.display_name || user?.username || "" }}
        actions={
          <Button asChild>
            <Link to="/admin/users/create">
              <FiUserPlus className="mr-2 h-4 w-4" />
              {t("common.create")}
            </Link>
          </Button>
        }
      />

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          icon={FiUsers}
          labelKey="dashboard.admin.stats.totalUsers"
          value={totalUsers}
          variant="blue"
        />
        <StatCard
          icon={FiBookOpen}
          labelKey="dashboard.admin.stats.totalClasses"
          value={totalClasses}
          variant="green"
        />
        <StatCard
          icon={FiShield}
          labelKey="dashboard.admin.stats.userManagement"
          value={t("common.manage")}
          variant="purple"
          href="/admin/users"
        />
        <StatCard
          icon={FiSettings}
          labelKey="dashboard.admin.stats.classManagement"
          value={t("common.manage")}
          variant="orange"
          href="/admin/classes"
        />
      </div>

      {/* 最近用户 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("dashboard.admin.recentUsers")}</CardTitle>
          <Button variant="link" asChild className="p-0 h-auto">
            <Link to="/admin/users" className="flex items-center gap-1">
              {t("common.viewAll")}
              <FiChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {userLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentUsers.length === 0 ? (
            <div className="p-12 text-center">
              <FiUsers className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {t("dashboard.admin.emptyUsers")}
              </p>
              <Button asChild>
                <Link to="/admin/users/create">
                  <FiPlus className="mr-2 h-4 w-4" />
                  {t("common.create")}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-6 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                        {(u.display_name || u.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link
                        to={`/admin/users/${u.id}`}
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        {u.display_name || u.username}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {u.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RoleBadge role={u.role} />
                    <StatusBadge status={u.status} />
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/admin/users/${u.id}`}>
                        <FiChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
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

function RoleBadge({ role }: { role: string }) {
  const { t } = useTranslation();

  const roleConfig: Record<
    string,
    {
      labelKey: string;
      variant: "destructive" | "default" | "secondary" | "outline";
    }
  > = {
    admin: { labelKey: "sidebar.admin", variant: "destructive" },
    teacher: { labelKey: "sidebar.teacher", variant: "default" },
    user: { labelKey: "sidebar.user", variant: "secondary" },
  };

  const config = roleConfig[role] || {
    labelKey: role,
    variant: "outline" as const,
  };

  return <Badge variant={config.variant}>{t(config.labelKey)}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();

  const statusConfig: Record<
    string,
    {
      labelKey: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    active: { labelKey: "status.active", variant: "default" },
    inactive: { labelKey: "status.inactive", variant: "secondary" },
    banned: { labelKey: "status.banned", variant: "destructive" },
  };

  const config = statusConfig[status] || {
    labelKey: status,
    variant: "outline" as const,
  };

  return <Badge variant={config.variant}>{t(config.labelKey)}</Badge>;
}
