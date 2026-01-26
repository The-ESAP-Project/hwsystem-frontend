import type { HomeworkUserStatus } from "@/types/generated/homework";

export interface StatusConfig {
  color: string;
  bgColor: string;
  icon: string;
  labelKey: string;
}

/**
 * 作业状态配置（学生视角）
 */
export const HOMEWORK_STATUS_CONFIG: Record<HomeworkUserStatus, StatusConfig> =
  {
    pending: {
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      icon: "Clock",
      labelKey: "homework.status.pending",
    },
    submitted: {
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      icon: "FileText",
      labelKey: "homework.status.submitted",
    },
    graded: {
      color: "text-green-600",
      bgColor: "bg-green-100",
      icon: "CheckCircle",
      labelKey: "homework.status.graded",
    },
  };

/**
 * 获取作业状态配置
 */
export function getHomeworkStatusConfig(
  status: HomeworkUserStatus,
): StatusConfig {
  return HOMEWORK_STATUS_CONFIG[status];
}

/**
 * 从提交状态推断作业状态
 */
export function inferHomeworkStatus(
  submission: {
    status: string;
    score: number | null;
  } | null,
): HomeworkUserStatus {
  if (!submission) {
    return "pending";
  }
  if (submission.score !== null) {
    return "graded";
  }
  return "submitted";
}
