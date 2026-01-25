/**
 * 运行时 URL 配置
 * 解决嵌入式前端 API URL 硬编码问题
 */

/**
 * 获取 API 基础 URL
 * 开发时可用环境变量覆盖，生产环境使用相对路径
 */
export function getApiBaseUrl(): string {
  if (import.meta.env.DEV && import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return "/api/v1";
}

/**
 * 获取 WebSocket URL
 * 开发时可用环境变量覆盖，生产环境根据当前页面协议自动判断
 */
export function getWsBaseUrl(): string {
  if (import.meta.env.DEV && import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}`;
}
