import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiAlertCircle,
  FiBarChart2,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiEdit,
  FiEdit3,
  FiFileText,
  FiList,
  FiMoreVertical,
  FiTrash2,
} from "react-icons/fi";
import { Link } from "react-router";
import { PageHeader, Pagination } from "@/components/common";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClassList } from "@/features/class/hooks/useClass";
import { useRoutePrefix } from "@/features/class/hooks/useClassBasePath";
import {
  useAllClassesHomeworks,
  useDeleteHomework,
} from "@/features/homework/hooks/useHomework";
import type { HomeworkListItemStringified } from "@/features/homework/services/homeworkService";
import { notify } from "@/stores/useNotificationStore";

type TabValue = "active" | "expired" | "all";

export function TeacherHomeworksPage() {
  const { t } = useTranslation();
  const prefix = useRoutePrefix();
  const [activeTab, setActiveTab] = useState<TabValue>("active");
  const [deleteTarget, setDeleteTarget] =
    useState<HomeworkListItemStringified | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const deleteHomework = useDeleteHomework();

  const { data: classData, isLoading: classLoading } = useClassList({
    page_size: 100,
  });
  const classes = classData?.items ?? [];

  // 获取所有班级的作业（包含统计信息）
  const classIds = useMemo(() => classes.map((c) => String(c.id)), [classes]);
  const { data: allHomeworks, isLoading: homeworksLoading } =
    useAllClassesHomeworks(classIds, { include_stats: true });

  // 分类作业
  const categorizedHomeworks = useMemo(() => {
    const now = Date.now();

    const active = allHomeworks.filter((hw) => {
      if (!hw.deadline) return true; // 无截止日期视为进行中
      return new Date(hw.deadline).getTime() > now;
    });

    const expired = allHomeworks.filter((hw) => {
      if (!hw.deadline) return false;
      return new Date(hw.deadline).getTime() <= now;
    });

    // 按创建时间排序（最近的在前）
    const sortByCreated = (
      a: HomeworkListItemStringified,
      b: HomeworkListItemStringified,
    ) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

    return {
      active: [...active].sort(sortByCreated),
      expired: [...expired].sort(sortByCreated),
      all: [...allHomeworks].sort(sortByCreated),
    };
  }, [allHomeworks]);

  // 获取当前 Tab 的数据并分页
  const currentTabData = categorizedHomeworks[activeTab];
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return currentTabData.slice(start, start + pageSize);
  }, [currentTabData, page, pageSize]);

  // 获取班级名称
  const getClassName = (classId: string) => {
    const cls = classes.find((c) => String(c.id) === classId);
    return cls?.name ?? "";
  };

  // 格式化截止日期
  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return t("dashboard.user.noDeadline");
    const date = new Date(deadline);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) {
      return `${t("homework.deadline.expired")} ${Math.abs(days)} ${t("myHomeworks.daysAgo")}`;
    } else if (days === 0) {
      return `${t("dashboard.user.deadline")}: ${t("myHomeworks.today")}`;
    } else if (days === 1) {
      return `${t("dashboard.user.deadline")}: ${t("myHomeworks.tomorrow")}`;
    } else if (days <= 7) {
      return `${t("dashboard.user.deadline")}: ${days} ${t("myHomeworks.daysLater")}`;
    } else {
      return `${t("dashboard.user.deadline")}: ${date.toLocaleDateString()}`;
    }
  };

  // 判断是否已过期
  const isExpired = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline).getTime() < Date.now();
  };

  const isLoading = classLoading || homeworksLoading;

  const renderHomeworkItem = (hw: HomeworkListItemStringified) => {
    const expired = isExpired(hw.deadline);
    const stats = hw.stats_summary;

    // 计算待批改数
    const pendingGrade = stats
      ? Number(stats.submitted_count) - Number(stats.graded_count)
      : 0;

    return (
      <Link
        key={hw.id}
        to={`${prefix}/classes/${hw.class_id}/homework/${hw.id}`}
        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`h-10 w-10 rounded-lg flex items-center justify-center text-white shrink-0 ${
              expired
                ? "bg-gradient-to-br from-gray-500 to-slate-500"
                : "bg-gradient-to-br from-blue-500 to-indigo-500"
            }`}
          >
            <FiFileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{hw.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {getClassName(String(hw.class_id))}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {/* 提交统计 */}
          {stats && (
            <Badge variant="outline" className="font-medium">
              {t("teacherHomeworks.submitted")} {String(stats.submitted_count)}/
              {String(stats.total_students)}
            </Badge>
          )}
          {/* 待批改 + 快速批改按钮 */}
          {pendingGrade > 0 && (
            <Link
              to={`${prefix}/classes/${hw.class_id}/homework/${hw.id}/submissions`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50 transition-colors cursor-pointer"
            >
              <FiEdit3 className="h-3.5 w-3.5" />
              {t("teacherHomeworks.grade")} ({pendingGrade})
            </Link>
          )}
          {/* 截止日期 */}
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              expired
                ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {formatDeadline(hw.deadline)}
          </span>
          <FiChevronRight className="h-4 w-4 text-muted-foreground" />
          {/* 快捷操作 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.preventDefault()}
              >
                <FiMoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  to={`${prefix}/classes/${hw.class_id}/homework/${hw.id}/submissions`}
                >
                  <FiList className="mr-2 h-4 w-4" />
                  {t("teacherHomeworks.actions.submissions")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to={`${prefix}/classes/${hw.class_id}/homework/${hw.id}/edit`}
                >
                  <FiEdit className="mr-2 h-4 w-4" />
                  {t("teacherHomeworks.actions.edit")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to={`${prefix}/classes/${hw.class_id}/homework/${hw.id}/stats`}
                >
                  <FiBarChart2 className="mr-2 h-4 w-4" />
                  {t("teacherHomeworks.actions.stats")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  setDeleteTarget(hw);
                }}
              >
                <FiTrash2 className="mr-2 h-4 w-4" />
                {t("teacherHomeworks.actions.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Link>
    );
  };

  const renderEmptyState = (type: TabValue) => {
    const config = {
      active: {
        icon: FiClock,
        message: t("teacherHomeworks.noActive"),
        color: "text-blue-500/50",
      },
      expired: {
        icon: FiCheckCircle,
        message: t("teacherHomeworks.noExpired"),
        color: "text-gray-500/50",
      },
      all: {
        icon: FiAlertCircle,
        message: t("teacherHomeworks.noHomeworks"),
        color: "text-purple-500/50",
      },
    };

    const { icon: Icon, message, color } = config[type];

    return (
      <div className="p-12 text-center">
        <Icon className={`h-12 w-12 ${color} mx-auto mb-4`} />
        <p className="text-muted-foreground">{message}</p>
      </div>
    );
  };

  const renderLoadingSkeleton = () => (
    <div className="p-4 space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );

  const renderHomeworkList = (
    homeworks: HomeworkListItemStringified[],
    type: TabValue,
    total: number,
  ) => {
    if (isLoading) {
      return renderLoadingSkeleton();
    }

    if (total === 0) {
      return renderEmptyState(type);
    }

    return <div>{homeworks.map((hw) => renderHomeworkItem(hw))}</div>;
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        titleKey="teacherHomeworks.title"
        descriptionKey="teacherHomeworks.description"
      />

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as TabValue);
          setPage(1); // Tab 切换时重置页码
        }}
      >
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="active" className="gap-2">
            <FiClock className="h-4 w-4" />
            <span>{t("teacherHomeworks.tabs.active")}</span>
            {!isLoading && categorizedHomeworks.active.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {categorizedHomeworks.active.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="expired" className="gap-2">
            <FiCheckCircle className="h-4 w-4" />
            <span>{t("teacherHomeworks.tabs.expired")}</span>
            {!isLoading && categorizedHomeworks.expired.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {categorizedHomeworks.expired.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <FiList className="h-4 w-4" />
            <span>{t("teacherHomeworks.tabs.all")}</span>
            {!isLoading && categorizedHomeworks.all.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {categorizedHomeworks.all.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardContent className="p-0">
            <TabsContent value="active" className="m-0">
              {renderHomeworkList(
                paginatedData,
                "active",
                categorizedHomeworks.active.length,
              )}
            </TabsContent>
            <TabsContent value="expired" className="m-0">
              {renderHomeworkList(
                paginatedData,
                "expired",
                categorizedHomeworks.expired.length,
              )}
            </TabsContent>
            <TabsContent value="all" className="m-0">
              {renderHomeworkList(
                paginatedData,
                "all",
                categorizedHomeworks.all.length,
              )}
            </TabsContent>
          </CardContent>
        </Card>

        {/* 分页 */}
        {currentTabData.length > 0 && (
          <Pagination
            current={page}
            total={currentTabData.length}
            pageSize={pageSize}
            pageSizeOptions={[10, 15, 30]}
            onChange={(newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize);
            }}
            showTotal
            showSizeChanger
            className="mt-4"
          />
        )}
      </Tabs>

      {/* 删除确认对话框 */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("teacherHomeworks.deleteConfirm.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("teacherHomeworks.deleteConfirm.description", {
                title: deleteTarget?.title,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  await deleteHomework.mutateAsync(deleteTarget.id);
                  notify.success(
                    `${t("common.delete")} ${t("common.confirm")}`,
                  );
                  setDeleteTarget(null);
                } catch {
                  notify.error(t("grade.error.failed"));
                }
              }}
              disabled={deleteHomework.isPending}
            >
              {deleteHomework.isPending
                ? t("common.loading")
                : t("common.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
