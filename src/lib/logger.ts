/**
 * 统一日志模块
 *
 * 提供统一的日志接口，便于：
 * 1. 统一日志格式
 * 2. 生产环境控制日志输出
 * 3. 后续集成监控服务（如 Sentry）
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerConfig {
  /** 是否启用日志输出 */
  enabled: boolean;
  /** 最低日志级别 */
  minLevel: LogLevel;
  /** 是否显示时间戳 */
  showTimestamp: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// 默认配置：开发环境输出所有日志，生产环境只输出 warn 和 error
const config: LoggerConfig = {
  enabled: true,
  minLevel: import.meta.env.DEV ? "debug" : "warn",
  showTimestamp: import.meta.env.DEV,
};

function shouldLog(level: LogLevel): boolean {
  return config.enabled && LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
}

function formatMessage(level: LogLevel, message: string): string {
  const prefix = `[${level.toUpperCase()}]`;
  if (config.showTimestamp) {
    const timestamp = new Date().toISOString();
    return `${timestamp} ${prefix} ${message}`;
  }
  return `${prefix} ${message}`;
}

/**
 * 日志工具
 *
 * @example
 * ```ts
 * import { logger } from "@/lib/logger";
 *
 * // 错误日志
 * logger.error("Failed to fetch data", error);
 *
 * // 警告日志
 * logger.warn("API deprecated", { endpoint: "/old-api" });
 *
 * // 信息日志
 * logger.info("User logged in", { userId: "123" });
 *
 * // 调试日志（生产环境不输出）
 * logger.debug("Request payload", payload);
 * ```
 */
export const logger = {
  /**
   * 调试日志 - 仅开发环境输出
   */
  debug(message: string, ...args: unknown[]): void {
    if (shouldLog("debug")) {
      console.debug(formatMessage("debug", message), ...args);
    }
  },

  /**
   * 信息日志
   */
  info(message: string, ...args: unknown[]): void {
    if (shouldLog("info")) {
      console.info(formatMessage("info", message), ...args);
    }
  },

  /**
   * 警告日志 - 非致命错误或降级处理
   */
  warn(message: string, ...args: unknown[]): void {
    if (shouldLog("warn")) {
      console.warn(formatMessage("warn", message), ...args);
    }
  },

  /**
   * 错误日志 - 需要关注的错误
   */
  error(message: string, ...args: unknown[]): void {
    if (shouldLog("error")) {
      console.error(formatMessage("error", message), ...args);

      // TODO: 集成错误监控服务
      // if (import.meta.env.PROD) {
      //   Sentry.captureException(args[0] instanceof Error ? args[0] : new Error(message));
      // }
    }
  },

  /**
   * 配置日志
   */
  configure(options: Partial<LoggerConfig>): void {
    Object.assign(config, options);
  },
};

export default logger;
