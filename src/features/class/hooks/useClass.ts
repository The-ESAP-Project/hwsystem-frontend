import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gradeKeys } from "@/features/grade/hooks/useGrade";
import { homeworkKeys } from "@/features/homework/hooks/useHomework";
import { submissionKeys } from "@/features/submission/hooks/useSubmission";
import { useCurrentUser } from "@/stores/useUserStore";
import type { Stringify } from "@/types";
import type { UpdateClassRequest } from "@/types/generated";
import { classService } from "../services/classService";

// Query Keys
export const classKeys = {
  all: ["classes"] as const,
  lists: () => [...classKeys.all, "list"] as const,
  list: (params?: { page?: number; page_size?: number; search?: string }) =>
    [...classKeys.lists(), params] as const,
  details: () => [...classKeys.all, "detail"] as const,
  detail: (id: string) => [...classKeys.details(), id] as const,
  byCode: (code: string) => [...classKeys.all, "code", code] as const,
  members: (classId: string, params?: Record<string, unknown>) =>
    [...classKeys.all, classId, "members", params] as const,
};

// Queries
export function useClassList(params?: {
  page?: number;
  page_size?: number;
  search?: string;
}) {
  const currentUser = useCurrentUser();
  const userId = currentUser?.id;
  
  return useQuery({
    queryKey: [...classKeys.list(params), userId] as const,
    queryFn: () => classService.list(params),
    enabled: !!userId,
  });
}

export function useClass(classId: string) {
  const currentUser = useCurrentUser();
  const userId = currentUser?.id;
  
  return useQuery({
    queryKey: [...classKeys.detail(classId), userId] as const,
    queryFn: () => classService.get(classId),
    enabled: !!classId && !!userId,
  });
}

export function useClassByCode(code: string) {
  return useQuery({
    queryKey: classKeys.byCode(code),
    queryFn: () => classService.getByCode(code),
    enabled: !!code,
  });
}

export function useClassMembers(
  classId: string,
  params?: {
    page?: number;
    page_size?: number;
    search?: string;
    role?: string;
  },
) {
  return useQuery({
    queryKey: classKeys.members(classId, params),
    queryFn: () => classService.getMembers(classId, params),
    enabled: !!classId,
  });
}

// Mutations
export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; description?: string | null }) =>
      classService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
    },
  });
}

export function useUpdateClass(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Stringify<UpdateClassRequest>) =>
      classService.update(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.detail(classId) });
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (classId: string) => classService.delete(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      // 清理关联的作业、提交和评分缓存
      queryClient.invalidateQueries({ queryKey: homeworkKeys.all });
      queryClient.invalidateQueries({ queryKey: submissionKeys.all });
      queryClient.invalidateQueries({ queryKey: gradeKeys.all });
    },
  });
}

export function useJoinClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteCode: string) => classService.join(inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
    },
  });
}

export function useUpdateMemberRole(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: "student" | "class_representative";
    }) => classService.updateMemberRole(classId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...classKeys.all, classId, "members"],
      });
      // 班级详情可能包含角色统计
      queryClient.invalidateQueries({
        queryKey: classKeys.detail(classId),
      });
    },
  });
}

export function useRemoveMember(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => classService.removeMember(classId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...classKeys.all, classId, "members"],
      });
      // 成员数量变化
      queryClient.invalidateQueries({
        queryKey: classKeys.detail(classId),
      });
      // 该用户的提交记录
      queryClient.invalidateQueries({ queryKey: submissionKeys.all });
      // 作业统计可能包含成员数
      queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
    },
  });
}

export function useLeaveClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classId, userId }: { classId: string; userId: string }) =>
      classService.leaveClass(classId, userId),
    onSuccess: () => {
      // 刷新班级列表（用户已退出，列表会减少）
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      // 刷新所有班级相关数据
      queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
}
