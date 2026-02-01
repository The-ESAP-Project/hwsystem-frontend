/**
 * 前端常量配置
 * 集中管理魔法数字，提高可维护性
 */

// ============ API 配置 ============

// DEPRECATED: 从后端 /api/v1/system/client-config 动态获取
// export const API_TIMEOUT = 10000;
// export const FILE_OPERATION_TIMEOUT = 120000;

// ============ 分页配置 ============

/** 默认页码 */
export const DEFAULT_PAGE = 1;

/** 默认每页条数（表格列表） */
export const DEFAULT_PAGE_SIZE = 20;

/** 卡片列表每页条数（适配 3 列网格） */
export const CARD_LIST_PAGE_SIZE = 12;

/** 小型列表每页条数 */
export const SMALL_LIST_PAGE_SIZE = 10;

/** 分页大小选项 - 卡片列表 */
export const CARD_PAGE_SIZE_OPTIONS = [6, 12, 24];

/** 分页大小选项 - 表格列表 */
export const TABLE_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/** 分页大小选项 - 小型列表 */
export const SMALL_PAGE_SIZE_OPTIONS = [5, 10, 20];

// ============ UI 配置 ============

/** 搜索防抖延迟时间（毫秒） */
export const DEBOUNCE_DELAY = 300;

// ============ 时间常量 ============

/** 1 分钟（毫秒） */
export const ONE_MINUTE_MS = 60 * 1000;

/** 1 小时（毫秒） */
export const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;

/** 1 天（毫秒） */
export const ONE_DAY_MS = 24 * ONE_HOUR_MS;

/** 3 天（毫秒） */
export const THREE_DAYS_MS = 3 * ONE_DAY_MS;

// ============ 文件上传配置 ============

/** 最大并发上传数 */
export const MAX_CONCURRENT_UPLOADS = 3;
