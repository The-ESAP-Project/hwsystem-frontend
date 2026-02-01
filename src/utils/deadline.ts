import { ONE_DAY_MS, THREE_DAYS_MS } from "@/lib/constants";

/**
 * 截止日期状态
 */
export type DeadlineStatus =
  | "expired"
  | "urgent"
  | "warning"
  | "normal"
  | "none";

/**
 * 截止日期信息
 */
export interface DeadlineInfo {
  /** 是否已过期 */
  isExpired: boolean;
  /** 是否紧急（24小时内） */
  isUrgent: boolean;
  /** 是否警告（3天内） */
  isWarning: boolean;
  /** 剩余毫秒数（过期为负数） */
  remainingMs: number | null;
  /** 状态 */
  status: DeadlineStatus;
}

/**
 * 获取截止日期信息
 * @param deadline 截止日期（ISO 8601 字符串或 null）
 * @param serverTime 服务器时间（ISO 8601 字符串），用于避免时区问题
 * @returns 截止日期信息，如果 deadline 为空则返回 null
 */
export function getDeadlineInfo(
  deadline: string | null,
  serverTime?: string,
): DeadlineInfo | null {
  if (!deadline) {
    return null;
  }

  const deadlineTime = new Date(deadline).getTime();
  const now = serverTime ? new Date(serverTime).getTime() : Date.now();
  const remainingMs = deadlineTime - now;

  const isExpired = remainingMs <= 0;
  const isUrgent = !isExpired && remainingMs <= ONE_DAY_MS;
  const isWarning = !isExpired && !isUrgent && remainingMs <= THREE_DAYS_MS;

  let status: DeadlineStatus;
  if (isExpired) {
    status = "expired";
  } else if (isUrgent) {
    status = "urgent";
  } else if (isWarning) {
    status = "warning";
  } else {
    status = "normal";
  }

  return {
    isExpired,
    isUrgent,
    isWarning,
    remainingMs,
    status,
  };
}

/**
 * 检查截止日期是否已过期
 * @param deadline 截止日期（ISO 8601 字符串或 null）
 * @param serverTime 服务器时间（ISO 8601 字符串）
 * @returns 是否已过期（如果 deadline 为空则返回 false）
 */
export function isDeadlineExpired(
  deadline: string | null,
  serverTime?: string,
): boolean {
  const info = getDeadlineInfo(deadline, serverTime);
  return info?.isExpired ?? false;
}

/**
 * 格式化剩余时间
 * @param ms 剩余毫秒数
 * @param locale 语言环境
 * @returns 格式化的剩余时间字符串
 */
export function formatRemainingTime(ms: number, locale = "zh-CN"): string {
  const isNegative = ms < 0;
  const absMs = Math.abs(ms);

  const days = Math.floor(absMs / ONE_DAY_MS);
  const hours = Math.floor((absMs % ONE_DAY_MS) / (60 * 60 * 1000));
  const minutes = Math.floor((absMs % (60 * 60 * 1000)) / (60 * 1000));

  const isZh = locale.startsWith("zh");

  let result: string;
  if (days > 0) {
    result = isZh ? `${days}天` : `${days}d`;
  } else if (hours > 0) {
    result = isZh ? `${hours}小时` : `${hours}h`;
  } else {
    result = isZh ? `${minutes}分钟` : `${minutes}m`;
  }

  if (isNegative) {
    return isZh ? `已过期 ${result}` : `${result} ago`;
  }

  return result;
}

/**
 * 获取截止日期的 CSS 类名
 */
export function getDeadlineClassName(status: DeadlineStatus): string {
  switch (status) {
    case "expired":
      return "text-red-600";
    case "urgent":
      return "text-orange-600";
    case "warning":
      return "text-yellow-600";
    case "normal":
      return "text-gray-600";
    default:
      return "text-gray-400";
  }
}
