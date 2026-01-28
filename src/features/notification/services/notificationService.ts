import api from "@/lib/api";
import type { Stringify } from "@/types";
import type {
  MarkAllReadResponse,
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
} from "@/types/generated";

// API 响应类型 - 直接使用生成类型的 Stringify 版本
// Notification 包含 notification_type（不是 type）
export type NotificationDetail = Stringify<Notification>;

export interface NotificationListResponseStringified {
  items: NotificationDetail[];
  pagination: Stringify<NotificationListResponse>["pagination"];
}

export const notificationService = {
  // 获取通知列表
  list: async (params?: {
    page?: number;
    size?: number;
    is_read?: boolean;
    type?: string;
  }) => {
    const { data } = await api.get<{
      data: NotificationListResponseStringified;
    }>("/notifications", { params });
    return data.data;
  },

  // 获取未读数量
  getUnreadCount: async (): Promise<Stringify<UnreadCountResponse>> => {
    const { data } = await api.get<{ data: UnreadCountResponse }>(
      "/notifications/unread-count",
    );
    return data.data as unknown as Stringify<UnreadCountResponse>;
  },

  // 标记为已读
  markAsRead: async (id: string) => {
    await api.put(`/notifications/${id}/read`);
  },

  // 标记所有为已读
  markAllAsRead: async () => {
    const { data } = await api.put<{ data: Stringify<MarkAllReadResponse> }>(
      "/notifications/read-all",
    );
    return data.data;
  },

  // 删除通知
  delete: async (id: string) => {
    await api.delete(`/notifications/${id}`);
  },
};
