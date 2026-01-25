import api from "@/lib/api";
import type { Stringify } from "@/types";
import type { SystemSettingsResponse } from "@/types/generated";

// API 响应类型 - 直接使用生成类型的 Stringify 版本
export type SystemSettings = Stringify<SystemSettingsResponse>;

export const systemService = {
  getSettings: async (): Promise<SystemSettings> => {
    const { data } = await api.get<{ data: SystemSettingsResponse }>(
      "/system/settings",
    );
    // bigint 序列化后变成 string，需要通过 unknown 转换
    return data.data as unknown as SystemSettings;
  },
};
