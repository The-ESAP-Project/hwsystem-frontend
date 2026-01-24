import { useLocation } from "react-router";

/**
 * 根据当前 URL 判断路由前缀（/admin、/teacher、/user）
 * 用于动态生成页面内链接，使同一组件在不同路由组下正确导航
 */
export function useRoutePrefix(): string {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin/")) return "/admin";
  if (pathname.startsWith("/teacher/")) return "/teacher";
  return "/user";
}
