import { useTranslation } from "react-i18next";
import { FiClock } from "react-icons/fi";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  type DeadlineStatus,
  formatRemainingTime,
  getDeadlineInfo,
} from "@/utils/deadline";
import type { HomeworkListItemStringified } from "../services/homeworkService";

const deadlineColorMap: Record<DeadlineStatus, string> = {
  expired: "text-destructive",
  urgent: "text-orange-600 dark:text-orange-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  normal: "text-muted-foreground",
  none: "text-muted-foreground",
};

interface HomeworkListItemProps {
  homework: HomeworkListItemStringified;
  basePath: string;
  isTeacher?: boolean;
}

export function HomeworkListItem({
  homework,
  basePath,
  isTeacher,
}: HomeworkListItemProps) {
  const { t, i18n } = useTranslation();
  const deadlineInfo = getDeadlineInfo(homework.deadline ?? null);
  const deadlineStatus: DeadlineStatus = deadlineInfo?.status ?? "none";
  const remainingMs = deadlineInfo?.remainingMs ?? null;
  const locale = i18n.language === "zh" ? "zh" : "en";

  const renderDeadlineText = () => {
    if (!homework.deadline) return null;
    if (deadlineStatus === "expired") {
      return t("homework.deadline.expired");
    }
    if (remainingMs) {
      return t("homework.deadline.dueIn", {
        time: formatRemainingTime(remainingMs, locale),
      });
    }
    return null;
  };

  const renderStatusBadge = () => {
    if (isTeacher && homework.stats_summary) {
      const { submitted_count, total_students } = homework.stats_summary;
      return (
        <Badge variant="secondary">
          {t("homework.status.submittedStats", {
            submitted: submitted_count,
            total: total_students,
          })}
        </Badge>
      );
    }
    if (!homework.my_submission) {
      return (
        <Badge variant="outline">{t("homework.status.notSubmitted")}</Badge>
      );
    }
    switch (homework.my_submission.status) {
      case "graded":
        return (
          <Badge className="bg-green-600 hover:bg-green-700 text-white">
            {homework.my_submission.score}/{homework.max_score}
          </Badge>
        );
      case "late":
        return <Badge variant="destructive">{t("homework.status.late")}</Badge>;
      default:
        return (
          <Badge variant="secondary">{t("homework.status.submitted")}</Badge>
        );
    }
  };

  const scorePercent =
    homework.my_submission?.status === "graded" &&
    homework.my_submission.score != null
      ? (homework.my_submission.score / Number(homework.max_score)) * 100
      : null;

  return (
    <Link to={`${basePath}/homework/${homework.id}`} className="block">
      <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground truncate">
              {homework.title}
            </h3>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span>{t("homework.maxScore", { score: homework.max_score })}</span>
            {homework.creator && (
              <span>
                {homework.creator.display_name || homework.creator.username}
              </span>
            )}
            {homework.deadline && (
              <span>
                {t("homework.deadlineDate", {
                  date: new Date(homework.deadline).toLocaleDateString(
                    locale === "zh" ? "zh-CN" : "en-US",
                  ),
                })}
              </span>
            )}
            <span>
              {t("homework.createdAt", {
                date: new Date(homework.created_at).toLocaleDateString(
                  locale === "zh" ? "zh-CN" : "en-US",
                ),
              })}
            </span>
          </div>
          {scorePercent !== null && (
            <div className="mt-2 max-w-48">
              <Progress value={scorePercent} className="h-1.5" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 ml-4 shrink-0">
          {renderDeadlineText() && (
            <span
              className={`flex items-center gap-1 text-xs font-medium ${deadlineColorMap[deadlineStatus]}`}
            >
              <FiClock className="h-3 w-3" />
              {renderDeadlineText()}
            </span>
          )}
          {renderStatusBadge()}
        </div>
      </div>
    </Link>
  );
}
