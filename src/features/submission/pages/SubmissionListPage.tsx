import { useState } from "react";
import { FiAlertCircle, FiArrowLeft, FiClock, FiEdit3 } from "react-icons/fi";
import { Link, useParams } from "react-router";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useHomework } from "@/features/homework/hooks/useHomework";
import { useSubmissionList } from "../hooks/useSubmission";

export function SubmissionListPage() {
  const { classId, homeworkId } = useParams<{
    classId: string;
    homeworkId: string;
  }>();
  const { data: homework } = useHomework(homeworkId!);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading, error } = useSubmissionList(homeworkId!, {
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const getStatusBadge = (status: string, isLate: boolean) => {
    if (status === "graded") {
      return <Badge variant="default">已批改</Badge>;
    }
    if (isLate) {
      return <Badge variant="secondary">迟交</Badge>;
    }
    return <Badge variant="outline">待批改</Badge>;
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
        <Link to={`/user/classes/${classId}/homework/${homeworkId}`}>
          <FiArrowLeft className="mr-2 h-4 w-4" />
          返回作业详情
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>提交列表</CardTitle>
              <CardDescription>{homework?.title}</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="筛选状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="pending">待批改</SelectItem>
                <SelectItem value="graded">已批改</SelectItem>
                <SelectItem value="late">迟交</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : data?.items.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <FiAlertCircle className="mx-auto h-12 w-12 mb-4" />
              <p>暂无提交</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data?.items.map((submission) => (
                <Link
                  key={submission.id}
                  to={`/teacher/submissions/${submission.id}/grade`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>
                          {(submission.creator?.display_name ||
                            submission.creator?.username ||
                            "?")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {submission.creator?.display_name ||
                            submission.creator?.username}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>v{submission.version}</span>
                          <span>·</span>
                          <span>
                            {new Date(submission.submitted_at).toLocaleString()}
                          </span>
                          {submission.is_late && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1 text-orange-600">
                                <FiClock className="h-3 w-3" />
                                迟交
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {submission.grade ? (
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {submission.grade.score}
                            <span className="text-sm text-muted-foreground">
                              /{homework?.max_score}
                            </span>
                          </p>
                          {getStatusBadge("graded", submission.is_late)}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {getStatusBadge("pending", submission.is_late)}
                          <Button variant="outline" size="sm">
                            <FiEdit3 className="mr-2 h-4 w-4" />
                            批改
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
