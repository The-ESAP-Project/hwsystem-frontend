import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiBell,
  FiBook,
  FiCheck,
  FiCheckCircle,
  FiClipboard,
  FiTrash2,
} from "react-icons/fi";
import { Link } from "react-router";
import { Pagination } from "@/components/common/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { notify } from "@/stores/useNotificationStore";
import { useCurrentUser } from "@/stores/useUserStore";
import type { NotificationType, ReferenceType } from "@/types/generated";
import {
  useDeleteNotification,
  useMarkAllAsRead,
  useMarkAsRead,
  useNotificationList,
  useUnreadCount,
} from "../hooks/useNotification";

const notificationTypeIcons: Record<string, React.ElementType> = {
  homework_created: FiBook,
  homework_updated: FiBook,
  homework_deadline: FiBook,
  submission_received: FiClipboard,
  grade_received: FiCheckCircle,
  grade_updated: FiCheckCircle,
  class_joined: FiBell,
  class_role_changed: FiBell,
  default: FiBell,
};

export function NotificationListPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const currentUser = useCurrentUser();
  const { data, isLoading, error } = useNotificationList({
    page,
    size: pageSize,
    is_read: filter === "unread" ? false : filter === "read" ? true : undefined,
  });
  const { data: unreadData } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  // 使用后端 API 获取准确的未读数量
  const unreadCount = Number(unreadData?.unread_count ?? 0);

  const notificationTypeLabels: Record<NotificationType, string> = {
    homework_created: t("notification.type.homeworkCreated"),
    homework_updated: t("notification.type.homeworkUpdated"),
    homework_deadline: t("notification.type.homeworkDeadline"),
    submission_received: t("notification.type.submissionReceived"),
    grade_received: t("notification.type.gradeReceived"),
    grade_updated: t("notification.type.gradeUpdated"),
    class_joined: t("notification.type.classJoined"),
    class_role_changed: t("notification.type.classRoleChanged"),
  };

  // 根据用户角色确定路由前缀
  const rolePrefix =
    currentUser?.role === "admin"
      ? "admin"
      : currentUser?.role === "teacher"
        ? "teacher"
        : "user";

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await markAsRead.mutateAsync(id);
    } catch {
      notify.error(t("notify.notification.operationFailed"));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
      notify.success(t("notify.notification.markedAllRead"));
    } catch {
      notify.error(t("notify.notification.operationFailed"));
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteNotification.mutateAsync(id);
      notify.success(t("notify.notification.deleteSuccess"));
    } catch {
      notify.error(t("notify.notification.deleteFailed"));
    }
  };

  const getNotificationLink = (notification: {
    reference_type: ReferenceType | null;
    reference_id: string | null;
  }) => {
    if (!notification.reference_type || !notification.reference_id) {
      return null;
    }

    // 根据角色和引用类型生成跳转路径
    switch (notification.reference_type) {
      case "homework":
        // 教师/管理员跳转到已布置作业页面，学生跳转到我的作业页面
        return `/${rolePrefix}/homeworks`;
      case "submission":
        // 所有角色都有提交相关页面
        return `/${rolePrefix}/homeworks`;
      case "class":
        return `/${rolePrefix}/classes/${notification.reference_id}`;
      case "grade":
        return `/${rolePrefix}/homeworks`;
      default:
        return null;
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-destructive">
          {t("common.loadError")}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("notification.center")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {unreadCount > 0
              ? t("notification.unreadCount", { count: unreadCount })
              : t("notification.noUnread")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={filter}
            onValueChange={(v) => {
              setFilter(v);
              setPage(1); // 筛选变化时重置页码
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={t("notification.filter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("notification.filterAll")}</SelectItem>
              <SelectItem value="unread">
                {t("notification.filterUnread")}
              </SelectItem>
              <SelectItem value="read">
                {t("notification.filterRead")}
              </SelectItem>
            </SelectContent>
          </Select>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              <FiCheck className="mr-2 h-4 w-4" />
              {t("notification.markAllRead")}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32 mt-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : data?.items.length === 0 ? (
            <div className="py-12 text-center">
              <FiBell className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                {t("notification.empty")}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {data?.items.map((notification) => {
                const Icon =
                  notificationTypeIcons[notification.notification_type] ||
                  notificationTypeIcons.default;
                const link = getNotificationLink(notification);

                const content = (
                  <div
                    key={`content-${notification.id}`}
                    className={`p-4 hover:bg-accent transition-colors ${
                      !notification.is_read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-2 rounded-full ${
                          !notification.is_read
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p
                              className={`font-medium ${
                                !notification.is_read
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.content}
                            </p>
                          </div>
                          {notification.notification_type && (
                            <Badge variant="outline" className="shrink-0">
                              {notificationTypeLabels[
                                notification.notification_type
                              ] || notification.notification_type}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2">
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) =>
                                  handleMarkAsRead(notification.id, e)
                                }
                              >
                                <FiCheck className="mr-1 h-4 w-4" />
                                {t("notification.markAsRead")}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDelete(notification.id, e)}
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );

                return link ? (
                  <Link key={notification.id} to={link}>
                    {content}
                  </Link>
                ) : (
                  <div key={notification.id}>{content}</div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 分页 */}
      {data && (
        <Pagination
          current={page}
          total={Number(data.pagination.total)}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 50]}
          onChange={(newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          }}
          showTotal
          showSizeChanger
          className="mt-4"
        />
      )}
    </div>
  );
}
