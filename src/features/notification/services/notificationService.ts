import api from "@/lib/api";
import type {
  MarkAllReadResponse,
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
} from "@/types/generated";

// API 响应类型
// Notification 包含 notification_type（不是 type）
export type NotificationDetail = Notification;

export interface NotificationListResponseStringified {
  items: NotificationDetail[];
  pagination: NotificationListResponse["pagination"];
}

export const notificationService = {
  // 获取通知列表
  list: async (params?: {
    page?: number;
    page_size?: number;
    is_read?: boolean;
    type?: string;
  }) => {
    const { data } = await api.get<{
      data: NotificationListResponseStringified;
    }>("/notifications", { params });
    return data.data;
  },

  // 获取未读数量
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const { data } = await api.get<{ data: UnreadCountResponse }>(
      "/notifications/unread-count",
    );
    return data.data;
  },

  // 标记为已读
  markAsRead: async (id: string) => {
    await api.put(`/notifications/${id}/read`);
  },

  // 标记所有为已读
  markAllAsRead: async () => {
    const { data } = await api.put<{ data: MarkAllReadResponse }>(
      "/notifications/read-all",
    );
    return data.data;
  },

  // 删除通知
  delete: async (id: string) => {
    await api.delete(`/notifications/${id}`);
  },
};
