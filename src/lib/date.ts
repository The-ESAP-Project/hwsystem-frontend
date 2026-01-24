/**
 * 日期格式化工具库
 * 统一项目中的日期显示格式
 */

export type DateInput = string | number | Date;

/**
 * 解析日期输入
 */
function parseDate(date: DateInput): Date {
  if (date instanceof Date) return date;
  return new Date(date);
}

/**
 * 格式化完整日期时间
 * @example "2024-01-15 14:30:00"
 */
export function formatDateTime(
  date: DateInput,
  locale: string = "zh-CN",
): string {
  const d = parseDate(date);
  return d.toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * 格式化仅日期
 * @example "2024-01-15"
 */
export function formatDate(date: DateInput, locale: string = "zh-CN"): string {
  const d = parseDate(date);
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * 格式化仅时间
 * @example "14:30:00"
 */
export function formatTime(date: DateInput, locale: string = "zh-CN"): string {
  const d = parseDate(date);
  return d.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * 格式化相对时间
 * @example "3 天前", "刚刚", "5 分钟后"
 */
export function formatRelative(
  date: DateInput,
  locale: string = "zh-CN",
): string {
  const d = parseDate(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  // 使用 Intl.RelativeTimeFormat
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (Math.abs(diffSec) < 60) {
    return rtf.format(diffSec, "second");
  }
  if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, "minute");
  }
  if (Math.abs(diffHour) < 24) {
    return rtf.format(diffHour, "hour");
  }
  if (Math.abs(diffDay) < 30) {
    return rtf.format(diffDay, "day");
  }

  // 超过 30 天，显示具体日期
  return formatDate(d, locale);
}

/**
 * 格式化截止时间提示
 * 根据剩余时间返回不同风格的提示
 */
export function formatDeadline(
  date: DateInput,
  locale: string = "zh-CN",
): {
  text: string;
  isExpired: boolean;
  isUrgent: boolean; // 24小时内截止
  isWarning: boolean; // 3天内截止
} {
  const d = parseDate(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  const isExpired = diffMs < 0;
  const isUrgent = !isExpired && diffHours <= 24;
  const isWarning = !isExpired && !isUrgent && diffDays <= 3;

  let text: string;
  if (isExpired) {
    text = locale === "zh-CN" ? "已截止" : "Expired";
  } else if (diffHours < 1) {
    const mins = Math.ceil(diffMs / (1000 * 60));
    text = locale === "zh-CN" ? `${mins} 分钟后截止` : `Due in ${mins} minutes`;
  } else if (diffHours < 24) {
    const hours = Math.ceil(diffHours);
    text = locale === "zh-CN" ? `${hours} 小时后截止` : `Due in ${hours} hours`;
  } else {
    const days = Math.ceil(diffDays);
    text = locale === "zh-CN" ? `${days} 天后截止` : `Due in ${days} days`;
  }

  return { text, isExpired, isUrgent, isWarning };
}

/**
 * 格式化简短日期（用于列表显示）
 * @example "今天 14:30", "昨天 09:00", "01-15 14:30"
 */
export function formatShortDate(
  date: DateInput,
  locale: string = "zh-CN",
): string {
  const d = parseDate(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const targetDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const time = d.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (targetDay.getTime() === today.getTime()) {
    return locale === "zh-CN" ? `今天 ${time}` : `Today ${time}`;
  }
  if (targetDay.getTime() === yesterday.getTime()) {
    return locale === "zh-CN" ? `昨天 ${time}` : `Yesterday ${time}`;
  }

  // 同一年
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleString(locale, {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  // 不同年份
  return formatDateTime(d, locale);
}

/**
 * 检查日期是否为今天
 */
export function isToday(date: DateInput): boolean {
  const d = parseDate(date);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * 检查日期是否已过期
 */
export function isExpired(date: DateInput): boolean {
  return parseDate(date).getTime() < Date.now();
}
