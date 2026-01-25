import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiUsers,
} from "react-icons/fi";
import { Link, useParams } from "react-router";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoutePrefix } from "@/features/class/hooks/useClassBasePath";
import { useHomework, useHomeworkStats } from "../hooks/useHomework";
import { homeworkService } from "../services/homeworkService";

// 分数区间颜色
const SCORE_COLORS = {
  "90-100": "#22c55e", // green-500
  "80-89": "#3b82f6", // blue-500
  "70-79": "#eab308", // yellow-500
  "60-69": "#f97316", // orange-500
  "0-59": "#ef4444", // red-500
} as const;

export function HomeworkStatsPage() {
  const { t } = useTranslation();
  const { classId, homeworkId } = useParams<{
    classId: string;
    homeworkId: string;
  }>();
  const prefix = useRoutePrefix();
  const { data: homework } = useHomework(homeworkId!);
  const { data: stats, isLoading, error } = useHomeworkStats(homeworkId!);
  const [isExporting, setIsExporting] = useState(false);

  // 导出统计报表
  const handleExport = async () => {
    if (!homeworkId) return;
    setIsExporting(true);
    try {
      const blob = await homeworkService.exportStats(homeworkId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `homework_${homeworkId}_stats.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // 准备图表数据
  const chartData = useMemo(() => {
    if (!stats?.score_distribution) return [];
    return stats.score_distribution.map((item) => ({
      range: item.range,
      count: Number(item.count),
      color: SCORE_COLORS[item.range as keyof typeof SCORE_COLORS] || "#6b7280",
    }));
  }, [stats?.score_distribution]);

  // 提交状态饼图数据
  const submissionPieData = useMemo(() => {
    if (!stats) return [];
    const submitted = Number(stats.submitted_count) || 0;
    const unsubmitted = (Number(stats.total_students) || 0) - submitted;
    return [
      {
        name: t("homeworkStats.pieChart.submitted"),
        value: submitted,
        color: "#22c55e",
      },
      {
        name: t("homeworkStats.pieChart.unsubmitted"),
        value: unsubmitted,
        color: "#ef4444",
      },
    ].filter((item) => item.value > 0);
  }, [stats, t]);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-destructive">
          {t("common.loadError")}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const submissionRate = stats?.submission_rate || 0;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link to={`${prefix}/classes/${classId}/homework/${homeworkId}`}>
          <FiArrowLeft className="mr-2 h-4 w-4" />
          {t("homeworkStats.backToDetail")}
        </Link>
      </Button>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("homeworkStats.title")}
          </h1>
          <p className="mt-1 text-muted-foreground">{homework?.title}</p>
        </div>
        <Button onClick={handleExport} disabled={isExporting}>
          <FiDownload className="mr-2 h-4 w-4" />
          {isExporting
            ? t("homeworkStats.exporting")
            : t("homeworkStats.export")}
        </Button>
      </div>

      {/* 概览卡片 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                <FiUsers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("homeworkStats.stats.totalStudents")}
                </p>
                <p className="text-2xl font-bold">
                  {stats?.total_students || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
                <FiCheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("homeworkStats.stats.submitted")}
                </p>
                <p className="text-2xl font-bold">
                  {stats?.submitted_count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
                <FiCheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("homeworkStats.stats.graded")}
                </p>
                <p className="text-2xl font-bold">{stats?.graded_count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900">
                <FiClock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("homeworkStats.stats.late")}
                </p>
                <p className="text-2xl font-bold">{stats?.late_count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 提交率饼图 */}
        <Card>
          <CardHeader>
            <CardTitle>{t("homeworkStats.submissionRate.title")}</CardTitle>
            <CardDescription>
              {t("homeworkStats.submissionRate.description", {
                submitted: stats?.submitted_count || 0,
                total: stats?.total_students || 0,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submissionPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={submissionPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {submissionPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="space-y-2">
                <Progress value={submissionRate} className="h-3" />
                <p className="text-2xl font-bold text-center">
                  {submissionRate.toFixed(1)}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 成绩统计 */}
        <Card>
          <CardHeader>
            <CardTitle>{t("homeworkStats.scoreStats.title")}</CardTitle>
            <CardDescription>
              {t("homeworkStats.scoreStats.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("homeworkStats.scoreStats.average")}
                </p>
                <p className="text-xl font-bold">
                  {stats?.score_stats?.average?.toFixed(1) || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("homeworkStats.scoreStats.max")}
                </p>
                <p className="text-xl font-bold text-green-600">
                  {stats?.score_stats?.max || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("homeworkStats.scoreStats.min")}
                </p>
                <p className="text-xl font-bold text-red-600">
                  {stats?.score_stats?.min || "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 分数分布柱状图 */}
        <Card>
          <CardHeader>
            <CardTitle>{t("homeworkStats.scoreDistribution.title")}</CardTitle>
            <CardDescription>
              {t("homeworkStats.scoreDistribution.description", {
                count: Number(stats?.graded_count) || 0,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `${value ?? 0}`,
                      t("homeworkStats.scoreDistribution.count"),
                    ]}
                    labelFormatter={(label) =>
                      `${t("homeworkStats.scoreDistribution.range")}: ${label}`
                    }
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                {t("homeworkStats.scoreDistribution.noData")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 未提交名单 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiAlertCircle className="h-5 w-5 text-destructive" />
              {t("homeworkStats.unsubmitted.title")}
            </CardTitle>
            <CardDescription>
              {t("homeworkStats.unsubmitted.description", {
                count: stats?.unsubmitted_students?.length || 0,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.unsubmitted_students &&
            stats.unsubmitted_students.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {stats.unsubmitted_students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">
                        {student.display_name || student.username}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{student.username}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {t("homeworkStats.unsubmitted.badge")}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                {t("homeworkStats.unsubmitted.allSubmitted")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
