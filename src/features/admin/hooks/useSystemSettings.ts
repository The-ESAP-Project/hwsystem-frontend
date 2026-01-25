import { useQuery } from "@tanstack/react-query";
import { type SystemSettings, systemService } from "../services/systemService";

// Query key factory
export const systemKeys = {
  all: ["system"] as const,
  settings: () => [...systemKeys.all, "settings"] as const,
};

// 获取系统设置
export function useSystemSettings() {
  return useQuery({
    queryKey: systemKeys.settings(),
    queryFn: () => systemService.getSettings(),
    staleTime: 5 * 60 * 1000, // 5 分钟缓存，系统设置不常变化
  });
}

export type { SystemSettings };
