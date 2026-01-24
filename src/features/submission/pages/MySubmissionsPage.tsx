import { FiArrowLeft, FiCheckCircle, FiClock } from "react-icons/fi";
import { useNavigate, useParams } from "react-router";
import { FilePreviewDialog } from "@/components/file/FilePreviewDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHomework } from "@/features/homework/hooks/useHomework";
import { useMySubmissions } from "../hooks/useSubmission";

export function MySubmissionsPage() {
  const { homeworkId } = useParams<{ homeworkId: string }>();
  const navigate = useNavigate();
  const { data: homework } = useHomework(homeworkId!);
  const { data, isLoading, error } = useMySubmissions(homeworkId!);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-destructive">加载失败，请刷新重试</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        <FiArrowLeft className="mr-2 h-4 w-4" />
        返回
      </Button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">我的提交历史</h1>
        <p className="mt-1 text-muted-foreground">{homework?.title}</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">暂无提交记录</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data?.items.map((submission, index) => (
            <Card
              key={submission.id}
              className={index === 0 ? "border-primary" : ""}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      第 {submission.version} 次提交
                      {index === 0 && <Badge variant="default">最新</Badge>}
                    </CardTitle>
                    <CardDescription>
                      <span className="flex items-center gap-2">
                        {new Date(submission.submitted_at).toLocaleString()}
                        {submission.is_late && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <FiClock className="h-3 w-3" />
                            迟交
                          </span>
                        )}
                      </span>
                    </CardDescription>
                  </div>
                  <div>
                    {submission.grade ? (
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {submission.grade.score}
                          <span className="text-sm text-muted-foreground">
                            /{homework?.max_score}
                          </span>
                        </p>
                        <Badge variant="default">
                          <FiCheckCircle className="mr-1 h-3 w-3" />
                          已批改
                        </Badge>
                      </div>
                    ) : (
                      <Badge variant="secondary">待批改</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {submission.content && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      提交内容
                    </p>
                    <div className="p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap">
                      {submission.content}
                    </div>
                  </div>
                )}

                {submission.attachments &&
                  submission.attachments.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        附件
                      </p>
                      <div className="space-y-2">
                        {submission.attachments.map((file) => (
                          <FilePreviewDialog
                            key={file.download_token}
                            file={file}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                {submission.grade?.comment && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      教师评语
                    </p>
                    <div className="p-3 rounded-lg bg-primary/10 text-sm">
                      {submission.grade.comment}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
