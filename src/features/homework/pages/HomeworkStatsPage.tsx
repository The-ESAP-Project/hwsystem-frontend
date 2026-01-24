import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiUsers,
} from "react-icons/fi";
import { Link, useParams } from "react-router";
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

export function HomeworkStatsPage() {
  const { classId, homeworkId } = useParams<{
    classId: string;
    homeworkId: string;
  }>();
  const prefix = useRoutePrefix();
  const { data: homework } = useHomework(homeworkId!);
  const { data: stats, isLoading, error } = useHomeworkStats(homeworkId!);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-destructive">加载失败，请刷新重试</div>
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
          返回作业详情
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">作业统计</h1>
        <p className="mt-1 text-muted-foreground">{homework?.title}</p>
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
                <p className="text-sm text-muted-foreground">总学生数</p>
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
                <p className="text-sm text-muted-foreground">已提交</p>
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
                <p className="text-sm text-muted-foreground">已批改</p>
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
                <p className="text-sm text-muted-foreground">迟交</p>
                <p className="text-2xl font-bold">{stats?.late_count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 提交率 */}
        <Card>
          <CardHeader>
            <CardTitle>提交率</CardTitle>
            <CardDescription>
              {stats?.submitted_count || 0} / {stats?.total_students || 0}{" "}
              人已提交
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={submissionRate} className="h-3" />
              <p className="text-2xl font-bold text-center">
                {submissionRate.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 成绩统计 */}
        <Card>
          <CardHeader>
            <CardTitle>成绩统计</CardTitle>
            <CardDescription>基于已批改的作业</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">平均分</p>
                <p className="text-xl font-bold">
                  {stats?.score_stats?.average?.toFixed(1) || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">最高分</p>
                <p className="text-xl font-bold text-green-600">
                  {stats?.score_stats?.max || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">最低分</p>
                <p className="text-xl font-bold text-red-600">
                  {stats?.score_stats?.min || "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 分数分布 */}
        <Card>
          <CardHeader>
            <CardTitle>分数分布</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.score_distribution &&
            stats.score_distribution.length > 0 ? (
              <div className="space-y-3">
                {stats.score_distribution.map((item) => (
                  <div key={item.range} className="flex items-center gap-3">
                    <span className="w-16 text-sm text-muted-foreground">
                      {item.range}
                    </span>
                    <div className="flex-1">
                      <Progress
                        value={
                          stats.graded_count
                            ? (Number(item.count) /
                                Number(stats.graded_count)) *
                              100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>
                    <span className="w-8 text-sm text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">暂无数据</p>
            )}
          </CardContent>
        </Card>

        {/* 未提交名单 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiAlertCircle className="h-5 w-5 text-destructive" />
              未提交名单
            </CardTitle>
            <CardDescription>
              {stats?.unsubmitted_students?.length || 0} 人未提交
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
                    <Badge variant="destructive">未提交</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                所有学生都已提交
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
