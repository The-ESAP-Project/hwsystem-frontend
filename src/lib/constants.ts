/**
 * 前端常量配置
 * 集中管理魔法数字，提高可维护性
 */

// ============ API 配置 ============

/** API 请求超时时间（毫秒） */
export const API_TIMEOUT = 10000;

/** 文件操作超时时间（毫秒）- 上传/导入/导出等大文件操作 */
export const FILE_OPERATION_TIMEOUT = 120000;

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
