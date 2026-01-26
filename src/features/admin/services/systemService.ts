import api from "@/lib/api";
import type { Stringify } from "@/types";
import type {
  AdminSettingsListResponse,
  SettingAuditListResponse,
  SettingResponse,
  SystemSettingsResponse,
} from "@/types/generated";

// API 响应类型 - 直接使用生成类型的 Stringify 版本
export type SystemSettings = Stringify<SystemSettingsResponse>;
export type AdminSettings = Stringify<AdminSettingsListResponse>;
export type SettingAudits = Stringify<SettingAuditListResponse>;

export interface UpdateSettingRequest {
  value: string;
}

export interface SettingAuditQuery {
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
    // bigint 序列化后变成 string，需要通过 unknown 转换
    return data.data as unknown as SystemSettings;
  },

  // 获取管理员设置
  getAdminSettings: async (): Promise<AdminSettings> => {
    const { data } = await api.get<{ data: AdminSettingsListResponse }>(
      "/system/admin/settings",
    );
    return data.data as unknown as AdminSettings;
  },

  // 更新配置
  updateSetting: async (
    key: string,
    request: UpdateSettingRequest,
  ): Promise<Stringify<SettingResponse>> => {
    const { data } = await api.put<{ data: SettingResponse }>(
      `/system/admin/settings/${encodeURIComponent(key)}`,
      request,
    );
    return data.data as unknown as Stringify<SettingResponse>;
  },

  // 获取审计日志
  getSettingAudits: async (
    query: SettingAuditQuery = {},
  ): Promise<SettingAudits> => {
    const { data } = await api.get<{ data: SettingAuditListResponse }>(
      "/system/admin/settings/audit",
      { params: query },
    );
    return data.data as unknown as SettingAudits;
  },
};
