import { useState } from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiFileText,
} from "react-icons/fi";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useHomework } from "@/features/homework/hooks/useHomework";
import { useRoutePrefix } from "@/features/class/hooks/useClassBasePath";
import {
  useSubmissionSummary,
  useUserSubmissionsForTeacher,
} from "../hooks/useSubmission";
import type { SubmissionSummaryItemStringified } from "../services/submissionService";

export function SubmissionListPage() {
  const { classId, homeworkId } = useParams<{
    classId: string;
    homeworkId: string;
  }>();
  const { data: homework } = useHomework(homeworkId!);
  const prefix = useRoutePrefix();
  const [selectedStudent, setSelectedStudent] =
    useState<SubmissionSummaryItemStringified | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  const { data, isLoading, error } = useSubmissionSummary(homeworkId!);

  // 获取选中学生的提交历史
  const { data: userSubmissions, isLoading: isLoadingHistory } =
    useUserSubmissionsForTeacher(
      homeworkId!,
      selectedStudent?.creator.id ?? "",
      !!selectedStudent,
    );

  const getStatusBadge = (status: string, isLate: boolean) => {
    if (status === "graded") {
      return (
        <Badge variant="default" className="gap-1">
          <FiCheckCircle className="h-3 w-3" />
          已批改
        </Badge>
      );
    }
    if (isLate) {
      return (
        <Badge variant="secondary" className="gap-1">
          <FiClock className="h-3 w-3" />
          迟交
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <FiFileText className="h-3 w-3" />
        待批改
      </Badge>
    );
  };

  const handleStudentClick = (student: SubmissionSummaryItemStringified) => {
    setSelectedStudent(student);
    setSelectedVersion(student.latest_submission.id);
  };

  const handleCloseSheet = () => {
    setSelectedStudent(null);
    setSelectedVersion(null);
  };

  // 获取选中版本的提交详情
  const selectedSubmission = userSubmissions?.items.find(
    (s) => s.id === selectedVersion,
  );

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
        <Link to={`${prefix}/classes/${classId}/homework/${homeworkId}`}>
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
            <div className="text-sm text-muted-foreground">
              共 {data?.pagination?.total ?? 0} 名学生提交
            </div>
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
              {data?.items.map((item) => (
                <div
                  key={item.creator.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleStudentClick(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleStudentClick(item);
                    }
                  }}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {(item.creator.display_name ||
                          item.creator.username ||
                          "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">
                        {item.creator.display_name || item.creator.username}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>共 {item.total_versions} 个版本</span>
                        <span>·</span>
                        <span>
                          最新: v{item.latest_submission.version} (
                          {new Date(
                            item.latest_submission.submitted_at,
                          ).toLocaleString()}
                          )
                        </span>
                        {item.latest_submission.is_late && (
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
                    {item.grade ? (
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {item.grade.score}
                          <span className="text-sm text-muted-foreground">
                            /{homework?.max_score}
                          </span>
                        </p>
                        {getStatusBadge(
                          "graded",
                          item.latest_submission.is_late,
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {getStatusBadge(
                          "pending",
                          item.latest_submission.is_late,
                        )}
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            to={`${prefix}/submissions/${item.latest_submission.id}/grade`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FiEdit3 className="mr-2 h-4 w-4" />
                            批改
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 学生提交详情 Sheet */}
      <Sheet open={!!selectedStudent} onOpenChange={handleCloseSheet}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {(selectedStudent?.creator.display_name ||
                    selectedStudent?.creator.username ||
                    "?")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>
                {selectedStudent?.creator.display_name ||
                  selectedStudent?.creator.username}
              </span>
            </SheetTitle>
            <SheetDescription>
              共 {selectedStudent?.total_versions} 个提交版本
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* 版本选择器 */}
            <div className="space-y-2">
              <span className="text-sm font-medium">选择版本</span>
              {isLoadingHistory ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedVersion ?? ""}
                  onValueChange={setSelectedVersion}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择版本" />
                  </SelectTrigger>
                  <SelectContent>
                    {userSubmissions?.items.map((submission) => (
                      <SelectItem key={submission.id} value={submission.id}>
                        v{submission.version} -{" "}
                        {new Date(submission.submitted_at).toLocaleString()}
                        {submission.is_late && " (迟交)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 提交内容 */}
            {selectedSubmission && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(
                      selectedSubmission.status ?? "pending",
                      selectedSubmission.is_late,
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      to={`${prefix}/submissions/${selectedSubmission.id}/grade`}
                    >
                      <FiEdit3 className="mr-2 h-4 w-4" />
                      {selectedStudent?.grade ? "查看评分" : "去批改"}
                    </Link>
                  </Button>
                </div>

                {/* 评分信息 */}
                {selectedStudent?.grade && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        评分
                      </span>
                      <span className="text-2xl font-bold">
                        {selectedStudent.grade.score}
                        <span className="text-sm text-muted-foreground font-normal">
                          /{homework?.max_score}
                        </span>
                      </span>
                    </div>
                    {selectedStudent.grade.comment && (
                      <div className="mt-2 pt-2 border-t">
                        <span className="text-sm text-muted-foreground">
                          评语：
                        </span>
                        <p className="text-sm mt-1">
                          {selectedStudent.grade.comment}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 提交内容预览 */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">提交内容</span>
                  <div className="p-4 bg-muted rounded-lg max-h-[300px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">
                      {selectedSubmission.content || "（无内容）"}
                    </pre>
                  </div>
                </div>

                {/* 附件信息 */}
                {selectedSubmission.attachments &&
                  selectedSubmission.attachments.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">附件</span>
                      <div className="space-y-1">
                        {selectedSubmission.attachments.map((attachment) => (
                          <div
                            key={attachment.download_token}
                            className="flex items-center gap-2 p-2 bg-muted rounded"
                          >
                            <FiFileText className="h-4 w-4" />
                            <span className="text-sm">
                              {attachment.original_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
