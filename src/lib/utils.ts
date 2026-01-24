// 通用工具函数
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 Tailwind CSS 类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化日期
 */
export function formatDate(date: string | Date, locale = "zh-CN"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date: string | Date, locale = "zh-CN"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 延迟执行
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 安全解析 JSON
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * 截止时间状态
 */
export type DeadlineStatus = "expired" | "urgent" | "warning" | "normal" | "none";

/**
 * 计算截止时间状态
 */
export function getDeadlineStatus(deadline: string | null): {
  status: DeadlineStatus;
  remainingMs: number | null;
} {
  if (!deadline) return { status: "none", remainingMs: null };
  const remaining = new Date(deadline).getTime() - Date.now();
  if (remaining <= 0) return { status: "expired", remainingMs: remaining };
  if (remaining <= 24 * 60 * 60 * 1000) return { status: "urgent", remainingMs: remaining };
  if (remaining <= 3 * 24 * 60 * 60 * 1000) return { status: "warning", remainingMs: remaining };
  return { status: "normal", remainingMs: remaining };
}

/**
 * 格式化剩余时间为可读字符串
 */
export function formatRemainingTime(ms: number, locale = "zh"): string {
  const abs = Math.abs(ms);
  const minutes = Math.floor(abs / (60 * 1000));
  const hours = Math.floor(abs / (60 * 60 * 1000));
  const days = Math.floor(abs / (24 * 60 * 60 * 1000));

  if (locale === "zh") {
    if (days > 0) return `${days}天`;
    if (hours > 0) return `${hours}小时`;
    return `${minutes}分钟`;
  }
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}
