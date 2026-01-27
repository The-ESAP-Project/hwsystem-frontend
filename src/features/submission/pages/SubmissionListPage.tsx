import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiFileText,
  FiPlayCircle,
  FiUserX,
} from "react-icons/fi";
import { Link, useNavigate, useParams } from "react-router";
import { Pagination } from "@/components/common/Pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClass } from "@/features/class/hooks/useClass";
import { useRoutePrefix } from "@/features/class/hooks/useClassBasePath";
import {
  useHomework,
  useHomeworkStats,
} from "@/features/homework/hooks/useHomework";
import {
  useSubmissionSummary,
  useUserSubmissionsForTeacher,
} from "../hooks/useSubmission";
import type { SubmissionSummaryItemStringified } from "../services/submissionService";

type TabValue = "all" | "submitted" | "unsubmitted";
type StatusFilter = "all" | "pending" | "graded" | "late";

// 导航状态类型，传递给批改页
export interface GradeNavigationState {
  pendingList: Array<{ id: string; studentName: string }>;
  homeworkId: string;
  classId: string;
}

export function SubmissionListPage() {
  const { t } = useTranslation();
  const { classId, homeworkId } = useParams<{
    classId: string;
    homeworkId: string;
  }>();
  const navigate = useNavigate();
  const { data: homework } = useHomework(homeworkId!);
  const { data: classData } = useClass(classId!);
  const prefix = useRoutePrefix();
  const [selectedStudent, setSelectedStudent] =
    useState<SubmissionSummaryItemStringified | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  // Tab 和筛选器状态
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 判断是否有评分权限（只有教师才能评分，课代表不能）
  const canGrade = classData?.my_role === "teacher";

  // 获取全部提交概览（用于列表展示）
  const { data, isLoading, error } = useSubmissionSummary(homeworkId!, {
    page,
    size: pageSize,
  });

  // 获取待批改的提交（使用 graded=false 筛选，避免分页问题）
  const { data: pendingData } = useSubmissionSummary(
    homeworkId!,
    canGrade ? { graded: false } : undefined,
  );

  const { data: stats, isLoading: statsLoading } = useHomeworkStats(
    homeworkId!,
  );

  // 待批改列表和数量（从专门的查询获取）
  const pendingSubmissions = pendingData?.items ?? [];
  const pendingCount = Number(
    pendingData?.pagination?.total ?? pendingSubmissions.length,
  );

  // 获取选中学生的提交历史
  const { data: userSubmissions, isLoading: isLoadingHistory } =
    useUserSubmissionsForTeacher(
      homeworkId!,
      selectedStudent?.creator.id ?? "",
      !!selectedStudent,
    );

  // 计算已提交和未提交的学生
  const { submitted, unsubmitted } = useMemo(() => {
    const submittedItems = data?.items ?? [];
    const unsubmittedItems = stats?.unsubmitted_students ?? [];

    return {
      submitted: submittedItems,
      unsubmitted: unsubmittedItems,
    };
  }, [data, stats]);

  // 根据 Tab 和筛选器过滤数据
  const filteredSubmitted = useMemo(() => {
    if (statusFilter === "all") return submitted;
    return submitted.filter((item) => {
      if (statusFilter === "pending") return !item.grade;
      if (statusFilter === "graded") return !!item.grade;
      if (statusFilter === "late") return item.latest_submission?.is_late;
      return true;
    });
  }, [submitted, statusFilter]);

  // 导航到批改页（带导航状态）
  const navigateToGrade = (submissionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    // 构建待批改列表 - 只包含未评分的提交
    const navState: GradeNavigationState = {
      pendingList: pendingSubmissions.map((s) => ({
        id: String(s.latest_submission.id),
        studentName: s.creator.display_name || s.creator.username,
      })),
      homeworkId: homeworkId!,
      classId: classId!,
    };

    navigate(`${prefix}/submissions/${submissionId}/grade`, {
      state: navState,
    });
  };

  const getStatusBadge = (status: string, isLate: boolean) => {
    if (status === "graded") {
      return (
        <Badge variant="default" className="gap-1">
          <FiCheckCircle className="h-3 w-3" />
          {t("submission.list.filter.graded")}
        </Badge>
      );
    }
    if (isLate) {
      return (
        <Badge variant="secondary" className="gap-1">
          <FiClock className="h-3 w-3" />
          {t("submission.list.filter.late")}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <FiFileText className="h-3 w-3" />
        {t("submission.list.filter.pending")}
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

  const totalLoading = isLoading || statsLoading;

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-destructive">
          {t("common.loadError")}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link to={`${prefix}/classes/${classId}/homework/${homeworkId}`}>
          <FiArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back")}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <CardTitle>{t("submission.list.title")}</CardTitle>
              <CardDescription>{homework?.title}</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                {t("submission.list.totalStudents", {
                  count: Number(stats?.total_students ?? 0),
                }) || `共 ${stats?.total_students ?? 0} 名学生`}
              </div>
              {/* 开始批改工作流按钮 */}
              {canGrade && pendingCount > 0 && (
                <Button
                  onClick={() =>
                    navigateToGrade(
                      String(pendingSubmissions[0].latest_submission.id),
                    )
                  }
                  className="gap-2"
                >
                  <FiPlayCircle className="h-4 w-4" />
                  {t("submission.list.startGrading")}
                  <Badge variant="secondary" className="ml-1">
                    {pendingCount}
                  </Badge>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as TabValue);
              setPage(1); // Tab 切换时重置页码
            }}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="gap-1">
                {t("submission.list.tabs.all")}
                {!totalLoading && (
                  <Badge
                    variant="secondary"
                    className="ml-1 px-1.5 py-0 text-xs"
                  >
                    {stats?.total_students ?? 0}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="submitted" className="gap-1">
                {t("submission.list.tabs.submitted")}
                {!totalLoading && (
                  <Badge
                    variant="secondary"
                    className="ml-1 px-1.5 py-0 text-xs"
                  >
                    {data?.pagination.total ?? 0}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="unsubmitted" className="gap-1">
                {t("submission.list.tabs.unsubmitted")}
                {!totalLoading && (
                  <Badge
                    variant="secondary"
                    className="ml-1 px-1.5 py-0 text-xs"
                  >
                    {unsubmitted.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 筛选器（仅已提交 Tab 显示） */}
          {activeTab === "submitted" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t("submission.list.filterBy")}:
              </span>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as StatusFilter)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("submission.list.filter.all")}
                  </SelectItem>
                  <SelectItem value="pending">
                    {t("submission.list.filter.pending")}
                  </SelectItem>
                  <SelectItem value="graded">
                    {t("submission.list.filter.graded")}
                  </SelectItem>
                  <SelectItem value="late">
                    {t("submission.list.filter.late")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 内容区域 */}
          {totalLoading ? (
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
          ) : (
            <>
              {/* 全部 Tab */}
              {activeTab === "all" && (
                <div className="space-y-2">
                  {/* 已提交学生 */}
                  {submitted.map((item) => (
                    <SubmittedStudentCard
                      key={item.creator.id}
                      item={item}
                      homework={homework}
                      getStatusBadge={getStatusBadge}
                      onStudentClick={handleStudentClick}
                      onGradeClick={navigateToGrade}
                      canGrade={canGrade}
                    />
                  ))}
                  {/* 未提交学生 */}
                  {unsubmitted.map((student) => (
                    <UnsubmittedStudentCard
                      key={String(student.id)}
                      student={student}
                      t={t}
                    />
                  ))}
                  {submitted.length === 0 && unsubmitted.length === 0 && (
                    <EmptyState t={t} />
                  )}
                </div>
              )}

              {/* 已提交 Tab */}
              {activeTab === "submitted" && (
                <div className="space-y-2">
                  {filteredSubmitted.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <FiAlertCircle className="mx-auto h-12 w-12 mb-4" />
                      <p>{t("submission.list.noSubmissions")}</p>
                    </div>
                  ) : (
                    filteredSubmitted.map((item) => (
                      <SubmittedStudentCard
                        key={item.creator.id}
                        item={item}
                        homework={homework}
                        getStatusBadge={getStatusBadge}
                        onStudentClick={handleStudentClick}
                        onGradeClick={navigateToGrade}
                        canGrade={canGrade}
                      />
                    ))
                  )}
                </div>
              )}

              {/* 未提交 Tab */}
              {activeTab === "unsubmitted" && (
                <div className="space-y-2">
                  {unsubmitted.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <FiCheckCircle className="mx-auto h-12 w-12 mb-4 text-green-500" />
                      <p>
                        {t("submission.list.allSubmitted") ||
                          "所有学生都已提交"}
                      </p>
                    </div>
                  ) : (
                    unsubmitted.map((student) => (
                      <UnsubmittedStudentCard
                        key={String(student.id)}
                        student={student}
                        t={t}
                      />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 分页（仅在已提交 Tab 显示） */}
      {data && activeTab === "submitted" && (
        <Pagination
          current={page}
          total={Number(data.pagination.total)}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 50]}
          onChange={(newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          }}
          showTotal
          showSizeChanger
          className="mt-4"
        />
      )}

      {/* 学生提交详情 Sheet */}
      <Sheet open={!!selectedStudent} onOpenChange={handleCloseSheet}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={selectedStudent?.creator?.avatar_url || undefined}
                />
                <AvatarFallback className="bg-primary/10 text-primary">
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
              {t("submission.list.totalVersions", {
                count: selectedStudent?.total_versions,
              }) || `共 ${selectedStudent?.total_versions} 个提交版本`}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* 版本选择器 */}
            <div className="space-y-2">
              <span className="text-sm font-medium">
                {t("submission.list.selectVersion")}
              </span>
              {isLoadingHistory ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedVersion ?? ""}
                  onValueChange={setSelectedVersion}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("submission.list.selectVersion")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {userSubmissions?.items.map((submission) => (
                      <SelectItem key={submission.id} value={submission.id}>
                        v{submission.version} -{" "}
                        {new Date(submission.submitted_at).toLocaleString()}
                        {submission.is_late &&
                          ` (${t("submission.list.filter.late")})`}
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
                  {canGrade && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateToGrade(selectedSubmission.id)}
                    >
                      <FiEdit3 className="mr-2 h-4 w-4" />
                      {selectedStudent?.grade
                        ? t("submission.list.editGrade")
                        : t("submission.list.goGrade")}
                    </Button>
                  )}
                </div>

                {/* 评分信息 */}
                {selectedStudent?.grade && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        {t("submission.list.score")}
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
                          {t("submission.list.comment")}：
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
                  <span className="text-sm font-medium">
                    {t("submission.list.content")}
                  </span>
                  <div className="p-4 bg-muted rounded-lg max-h-[300px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">
                      {selectedSubmission.content ||
                        t("submission.list.noContent") ||
                        "（无内容）"}
                    </pre>
                  </div>
                </div>

                {/* 附件信息 */}
                {selectedSubmission.attachments &&
                  selectedSubmission.attachments.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">
                        {t("submission.list.attachments")}
                      </span>
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

// 已提交学生卡片组件
function SubmittedStudentCard({
  item,
  homework,
  getStatusBadge,
  onStudentClick,
  onGradeClick,
  canGrade,
}: {
  item: SubmissionSummaryItemStringified;
  homework: { max_score?: number } | undefined;
  getStatusBadge: (status: string, isLate: boolean) => React.ReactNode;
  onStudentClick: (student: SubmissionSummaryItemStringified) => void;
  onGradeClick: (submissionId: string, e?: React.MouseEvent) => void;
  canGrade: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onStudentClick(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onStudentClick(item);
        }
      }}
      className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarImage src={item.creator?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
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
            <span>
              {t("submission.list.versions", { count: item.total_versions }) ||
                `共 ${item.total_versions} 个版本`}
            </span>
            <span>·</span>
            <span>
              {t("submission.list.latest")}: v{item.latest_submission.version} (
              {new Date(item.latest_submission.submitted_at).toLocaleString()})
            </span>
            {item.latest_submission.is_late && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1 text-orange-600">
                  <FiClock className="h-3 w-3" />
                  {t("submission.list.filter.late")}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {item.grade ? (
          // 已评分：显示分数和（如果有权限）编辑按钮
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="font-bold text-lg">
                {item.grade.score}
                <span className="text-sm text-muted-foreground">
                  /{homework?.max_score}
                </span>
              </p>
              {getStatusBadge("graded", item.latest_submission.is_late)}
            </div>
            {canGrade && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => onGradeClick(item.latest_submission.id, e)}
              >
                <FiEdit3 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          // 未评分：显示状态和（如果有权限）评分按钮
          <div className="flex items-center gap-2">
            {getStatusBadge("pending", item.latest_submission.is_late)}
            {canGrade && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => onGradeClick(item.latest_submission.id, e)}
              >
                <FiEdit3 className="mr-2 h-4 w-4" />
                {t("submission.list.grade")}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 未提交学生卡片组件
function UnsubmittedStudentCard({
  student,
  t,
}: {
  student: {
    id: string | bigint;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  t: (key: string) => string;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 opacity-75">
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarImage src={student?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {(student.display_name || student.username || "?")[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-foreground">
            {student.display_name || student.username}
          </p>
          <p className="text-sm text-muted-foreground">@{student.username}</p>
        </div>
      </div>
      <Badge variant="destructive" className="gap-1">
        <FiUserX className="h-3 w-3" />
        {t("submission.list.unsubmittedBadge")}
      </Badge>
    </div>
  );
}

// 空状态组件
function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <div className="py-8 text-center text-muted-foreground">
      <FiAlertCircle className="mx-auto h-12 w-12 mb-4" />
      <p>{t("submission.list.noStudents")}</p>
    </div>
  );
}
