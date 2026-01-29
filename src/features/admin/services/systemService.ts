import api from "@/lib/api";
import type {
  AdminSettingsListResponse,
  SettingAuditListResponse,
  SettingResponse,
  SystemSettingsResponse,
  UpdateSettingRequest,
} from "@/types/generated";

// API 响应类型
export type SystemSettings = SystemSettingsResponse;
export type AdminSettings = AdminSettingsListResponse;
export type SettingAudits = SettingAuditListResponse;

// 前端友好的输入类型
export interface SettingAuditQueryInput {
  key?: string;
  page?: number;
  size?: number;
}

export const systemService = {
  // 获取公开设置（只读）
  getSettings: async (): Promise<SystemSettings> => {
    const { data } = await api.get<{ data: SystemSettingsResponse }>(
      "/system/settings",
    );
    return data.data;
  },

  // 获取管理员设置
  getAdminSettings: async (): Promise<AdminSettings> => {
    const { data } = await api.get<{ data: AdminSettingsListResponse }>(
      "/system/admin/settings",
    );
    return data.data;
  },

  // 更新配置
  updateSetting: async (
    key: string,
    request: UpdateSettingRequest,
  ): Promise<SettingResponse> => {
    const { data } = await api.put<{ data: SettingResponse }>(
      `/system/admin/settings/${encodeURIComponent(key)}`,
      request,
    );
    return data.data;
  },

  // 获取审计日志
  getSettingAudits: async (
    query: SettingAuditQueryInput = {},
  ): Promise<SettingAudits> => {
    const { data } = await api.get<{ data: SettingAuditListResponse }>(
      "/system/admin/settings/audit",
      { params: query },
    );
    return data.data;
  },
};
