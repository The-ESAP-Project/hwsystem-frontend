import api from "@/lib/api";
import type {
  MarkAllReadResponse,
  Notification,
  NotificationListResponse,
} from "@/types/generated";

// API 响应扩展类型（后端返回时 ID 为 string）
export interface NotificationWithDetails
  extends Omit<Notification, "id" | "user_id" | "reference_id"> {
  id: string;
  user_id: string;
  reference_id?: string;
  // 兼容旧字段名
  type?: string;
}

export interface NotificationListResponseWithDetails {
  items: NotificationWithDetails[];
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
      data: {
        notifications: NotificationWithDetails[];
        pagination: NotificationListResponse["pagination"];
      };
    }>("/notifications", {
      params,
    });
    // 映射 API 返回的 notifications 到前端期望的 items
    return {
      items: data.data.notifications,
      pagination: data.data.pagination,
    };
  },

  // 获取未读数量
  getUnreadCount: async () => {
    const { data } = await api.get<{ data: { count: number } }>(
      "/notifications/unread-count",
    );
    // 转换字段名以兼容前端使用
    return { unread_count: data.data.count };
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
