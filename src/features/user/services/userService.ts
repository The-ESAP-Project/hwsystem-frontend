import api from "@/lib/api";
import type { Stringify } from "@/types";
import type { UserStatsResponse } from "@/types/generated/user";

// 用户统计响应类型
export type UserStatsStringified = Stringify<UserStatsResponse>;

export const userService = {
  // 获取当前用户统计
  getMyStats: async () => {
    const { data } = await api.get<{ data: UserStatsStringified }>(
      "/users/me/stats",
    );
    return data.data;
  },
};
