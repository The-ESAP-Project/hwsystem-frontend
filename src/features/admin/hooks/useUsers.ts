import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNotificationStore } from "@/stores/useNotificationStore";
import {
  type CreateUserRequest,
  type UpdateUserRequest,
  type UserListParams,
  type UserWithStringId,
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
  const queryClient = useQueryClient();
  const success = useNotificationStore((s) => s.success);
  const error = useNotificationStore((s) => s.error);

  return useMutation({
    mutationFn: (data: CreateUserRequest) => userService.create(data),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      success("创建成功", `用户 ${user.username} 已创建`);
    },
    onError: (err: Error) => {
      error("创建失败", err.message);
    },
  });
}

// 更新用户
export function useUpdateUser() {
  const queryClient = useQueryClient();
  const success = useNotificationStore((s) => s.success);
  const error = useNotificationStore((s) => s.error);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      userService.update(id, data),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(user.id) });
      success("更新成功", `用户 ${user.username} 已更新`);
    },
    onError: (err: Error) => {
      error("更新失败", err.message);
    },
  });
}

// 删除用户
export function useDeleteUser() {
  const queryClient = useQueryClient();
  const success = useNotificationStore((s) => s.success);
  const error = useNotificationStore((s) => s.error);

  return useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      success("删除成功", "用户已删除");
    },
    onError: (err: Error) => {
      error("删除失败", err.message);
    },
  });
}

export type { UserWithStringId, CreateUserRequest, UpdateUserRequest };
