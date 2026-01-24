import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiCheck,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiFileText,
} from "react-icons/fi";
import { Link } from "react-router";
import { PageHeader } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClassList } from "@/features/class/hooks/useClass";
import { useRoutePrefix } from "@/features/class/hooks/useClassBasePath";
import { useAllClassesHomeworks } from "@/features/homework/hooks/useHomework";
import type { HomeworkListItemStringified } from "@/features/homework/services/homeworkService";

type TabValue = "pending" | "submitted" | "graded";

export function MyHomeworksPage() {
  const { t } = useTranslation();
  const prefix = useRoutePrefix();
  const [activeTab, setActiveTab] = useState<TabValue>("pending");

  const { data: classData, isLoading: classLoading } = useClassList();
  const classes = classData?.items ?? [];

  // 获取所有班级的作业
  const classIds = useMemo(() => classes.map((c) => String(c.id)), [classes]);
  const { data: allHomeworks, isLoading: homeworksLoading } =
    useAllClassesHomeworks(classIds);

  // 分类作业
  const categorizedHomeworks = useMemo(() => {
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

    // 已提交作业按提交时间排序（最近的在前）
    const sortedSubmitted = [...submitted].sort((a, b) => {
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });

    // 已批改作业按更新时间排序（最近的在前）
    const sortedGraded = [...graded].sort((a, b) => {
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });

    return {
      pending: sortedPending,
      submitted: sortedSubmitted,
      graded: sortedGraded,
    };
  }, [allHomeworks]);

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
      return `${t("dashboard.user.deadline")}: ${Math.abs(days)} ${t("myHomeworks.daysAgo")}`;
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

  // 判断是否临近截止
  const isUrgent = (deadline: string | null) => {
    if (!deadline) return false;
    const diff = new Date(deadline).getTime() - Date.now();
    return diff > 0 && diff < 24 * 60 * 60 * 1000;
  };

  // 判断是否已过期
  const isExpired = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline).getTime() < Date.now();
  };

  const isLoading = classLoading || homeworksLoading;

  const renderHomeworkItem = (
    hw: HomeworkListItemStringified,
    showScore: boolean = false,
  ) => {
    const urgent = isUrgent(hw.deadline);
    const expired = isExpired(hw.deadline);

    return (
      <Link
        key={hw.id}
        to={`${prefix}/classes/${hw.class_id}/homework/${hw.id}`}
        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`h-10 w-10 rounded-lg flex items-center justify-center text-white shrink-0 ${
              showScore
                ? "bg-gradient-to-br from-green-500 to-emerald-500"
                : expired
                  ? "bg-gradient-to-br from-red-500 to-rose-500"
                  : "bg-gradient-to-br from-orange-500 to-amber-500"
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
          {showScore && hw.my_submission?.score !== null && (
            <Badge variant="secondary" className="font-medium">
              {hw.my_submission?.score} / {hw.max_score}
            </Badge>
          )}
          {!showScore && (
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                expired
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : urgent
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {formatDeadline(hw.deadline)}
            </span>
          )}
          {hw.my_submission?.is_late && (
            <Badge variant="destructive" className="text-xs">
              {t("homework.status.late")}
            </Badge>
          )}
          <FiChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </Link>
    );
  };

  const renderEmptyState = (type: TabValue) => {
    const config = {
      pending: {
        icon: FiCheck,
        message: t("dashboard.user.allDone"),
        color: "text-green-500/50",
      },
      submitted: {
        icon: FiClock,
        message: t("myHomeworks.noSubmitted"),
        color: "text-blue-500/50",
      },
      graded: {
        icon: FiCheckCircle,
        message: t("myHomeworks.noGraded"),
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
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );

  const renderHomeworkList = (
    homeworks: HomeworkListItemStringified[],
    type: TabValue,
  ) => {
    if (isLoading) {
      return renderLoadingSkeleton();
    }

    if (homeworks.length === 0) {
      return renderEmptyState(type);
    }

    return (
      <div>
        {homeworks.map((hw) => renderHomeworkItem(hw, type === "graded"))}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        titleKey="myHomeworks.title"
        descriptionKey="myHomeworks.description"
      />

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
      >
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="pending" className="gap-2">
            <FiClock className="h-4 w-4" />
            <span>{t("homework.tabs.pending")}</span>
            {!isLoading && categorizedHomeworks.pending.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {categorizedHomeworks.pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="submitted" className="gap-2">
            <FiFileText className="h-4 w-4" />
            <span>{t("homework.tabs.submitted")}</span>
            {!isLoading && categorizedHomeworks.submitted.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {categorizedHomeworks.submitted.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="graded" className="gap-2">
            <FiCheckCircle className="h-4 w-4" />
            <span>{t("homework.tabs.graded")}</span>
            {!isLoading && categorizedHomeworks.graded.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {categorizedHomeworks.graded.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardContent className="p-0">
            <TabsContent value="pending" className="m-0">
              {renderHomeworkList(categorizedHomeworks.pending, "pending")}
            </TabsContent>
            <TabsContent value="submitted" className="m-0">
              {renderHomeworkList(categorizedHomeworks.submitted, "submitted")}
            </TabsContent>
            <TabsContent value="graded" className="m-0">
              {renderHomeworkList(categorizedHomeworks.graded, "graded")}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
