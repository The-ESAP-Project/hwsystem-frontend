import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type AdminSettings,
  type SettingAuditQuery,
  type SettingAudits,
  type SystemSettings,
  systemService,
  type UpdateSettingRequest,
} from "../services/systemService";

// Query key factory
export const systemKeys = {
  all: ["system"] as const,
  settings: () => [...systemKeys.all, "settings"] as const,
  adminSettings: () => [...systemKeys.all, "admin-settings"] as const,
  audits: (query?: SettingAuditQuery) =>
    [...systemKeys.all, "audits", query] as const,
};

// 获取系统设置（只读）
export function useSystemSettings() {
  return useQuery({
    queryKey: systemKeys.settings(),
    queryFn: () => systemService.getSettings(),
    staleTime: 5 * 60 * 1000, // 5 分钟缓存，系统设置不常变化
  });
}

// 获取管理员设置
export function useAdminSettings() {
  return useQuery({
    queryKey: systemKeys.adminSettings(),
    queryFn: () => systemService.getAdminSettings(),
    staleTime: 1 * 60 * 1000, // 1 分钟缓存
  });
}

// 更新配置
export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      key,
      request,
    }: {
      key: string;
      request: UpdateSettingRequest;
    }) => systemService.updateSetting(key, request),
    onSuccess: () => {
      // 更新成功后刷新配置列表
      queryClient.invalidateQueries({ queryKey: systemKeys.settings() });
      queryClient.invalidateQueries({ queryKey: systemKeys.adminSettings() });
    },
  });
}

// 获取审计日志
export function useSettingAudits(query: SettingAuditQuery = {}) {
  return useQuery({
    queryKey: systemKeys.audits(query),
    queryFn: () => systemService.getSettingAudits(query),
    staleTime: 30 * 1000, // 30 秒缓存
  });
}

export type { AdminSettings, SettingAudits, SystemSettings };
