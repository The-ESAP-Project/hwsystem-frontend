import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { classKeys } from "@/features/class/hooks/useClass";
import { gradeKeys } from "@/features/grade/hooks/useGrade";
import { submissionKeys } from "@/features/submission/hooks/useSubmission";
import { useApiError } from "@/hooks/useApiError";
import { useNotificationStore } from "@/stores/useNotificationStore";
import {
  type CreateUserRequest,
  type UpdateUserRequest,
  type UserDetail,
  type UserExportParams,
  type UserImportResponseStringified,
  type UserListParams,
  userService,
} from "../services/userService";

// Query key factory
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: UserListParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// 获取用户列表
export function useUserList(params: UserListParams = {}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => userService.list(params),
  });
}

// 获取用户详情
export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: userKeys.detail(id!),
    queryFn: () => userService.get(id!),
    enabled: !!id,
  });
}

// 创建用户
export function useCreateUser() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const success = useNotificationStore((s) => s.success);
  const { handleError } = useApiError();

  return useMutation({
    mutationFn: (data: CreateUserRequest) => userService.create(data),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      success(
        t("notify.user.createSuccess"),
        t("notify.user.created", { username: user.username }),
      );
    },
    onError: (err) => {
      handleError(err, { title: t("notify.user.createFailed") });
    },
  });
}

// 更新用户
export function useUpdateUser() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const success = useNotificationStore((s) => s.success);
  const { handleError } = useApiError();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      userService.update(id, data),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(user.id) });
      // 如果用户是教师/成员，班级信息需更新
      queryClient.invalidateQueries({ queryKey: classKeys.all });
      // 提交列表中的用户信息
      queryClient.invalidateQueries({ queryKey: submissionKeys.all });
      success(
        t("notify.user.updateSuccess"),
        t("notify.user.updated", { username: user.username }),
      );
    },
    onError: (err) => {
      handleError(err, { title: t("notify.user.updateFailed") });
    },
  });
}

// 删除用户
export function useDeleteUser() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const success = useNotificationStore((s) => s.success);
  const { handleError } = useApiError();

  return useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      // 清理关联的班级成员、提交和评分缓存
      queryClient.invalidateQueries({ queryKey: classKeys.all });
      queryClient.invalidateQueries({ queryKey: submissionKeys.all });
      queryClient.invalidateQueries({ queryKey: gradeKeys.all });
      success(t("notify.user.deleteSuccess"), t("notify.user.deleted"));
    },
    onError: (err) => {
      handleError(err, { title: t("notify.user.deleteFailed") });
    },
  });
}

// 导入用户
export function useImportUsers() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { handleError } = useApiError();

  return useMutation({
    mutationFn: (file: File) => userService.import(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
    onError: (err) => {
      handleError(err, { title: t("notify.user.importFailed") });
    },
  });
}

// 导出用户
export function useExportUsers() {
  const { t } = useTranslation();
  const { handleError } = useApiError();
  const success = useNotificationStore((s) => s.success);

  return useMutation({
    mutationFn: (params: UserExportParams) => userService.export(params),
    onSuccess: (blob, params) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users.${params.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success(t("notify.user.exportSuccess"), t("notify.user.exported"));
    },
    onError: (err) => {
      handleError(err, { title: t("notify.user.exportFailed") });
    },
  });
}

// 下载导入模板
export function useDownloadImportTemplate() {
  const { t } = useTranslation();
  const { handleError } = useApiError();

  return useMutation({
    mutationFn: (format: "csv" | "xlsx") =>
      userService.downloadTemplate(format),
    onSuccess: (blob, format) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `user_import_template.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onError: (err) => {
      handleError(err, { title: t("notify.user.templateDownloadFailed") });
    },
  });
}

export type {
  UserDetail,
  CreateUserRequest,
  UpdateUserRequest,
  UserImportResponseStringified,
};
