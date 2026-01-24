import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type SubmissionCreateInput,
  submissionService,
} from "../services/submissionService";

// Query Keys
export const submissionKeys = {
  all: ["submissions"] as const,
  lists: () => [...submissionKeys.all, "list"] as const,
  list: (
    homeworkId: string,
    params?: {
      page?: number;
      page_size?: number;
      status?: string;
      latest_only?: boolean;
    },
  ) => [...submissionKeys.lists(), homeworkId, params] as const,
  details: () => [...submissionKeys.all, "detail"] as const,
  detail: (submissionId: string) =>
    [...submissionKeys.details(), submissionId] as const,
  my: (homeworkId: string) =>
    [...submissionKeys.all, "my", homeworkId] as const,
  myLatest: (homeworkId: string) =>
    [...submissionKeys.all, "my", homeworkId, "latest"] as const,
  // 新增：提交概览
  summary: (homeworkId: string, params?: { page?: number; size?: number }) =>
    [...submissionKeys.all, "summary", homeworkId, params] as const,
  // 新增：某学生的提交历史（教师视角）
  userSubmissions: (homeworkId: string, userId: string) =>
    [...submissionKeys.all, "user", homeworkId, userId] as const,
};

// Queries
export function useSubmissionList(
  homeworkId: string,
  params?: {
    page?: number;
    page_size?: number;
    status?: string;
    latest_only?: boolean;
  },
) {
  return useQuery({
    queryKey: submissionKeys.list(homeworkId, params),
    queryFn: () => submissionService.list(homeworkId, params),
    enabled: !!homeworkId,
  });
}

export function useSubmission(submissionId: string) {
  return useQuery({
    queryKey: submissionKeys.detail(submissionId),
    queryFn: () => submissionService.get(submissionId),
    enabled: !!submissionId,
  });
}

export function useMySubmissions(homeworkId: string) {
  return useQuery({
    queryKey: submissionKeys.my(homeworkId),
    queryFn: () => submissionService.getMy(homeworkId),
    enabled: !!homeworkId,
  });
}

export function useMyLatestSubmission(homeworkId: string) {
  return useQuery({
    queryKey: submissionKeys.myLatest(homeworkId),
    queryFn: async () => {
      try {
        return await submissionService.getMyLatest(homeworkId);
      } catch (error: unknown) {
        // 404 表示尚未提交，返回 undefined 而不是抛错（防御性处理）
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === 404
        ) {
          return undefined;
        }
        throw error;
      }
    },
    enabled: !!homeworkId,
  });
}

// 新增：获取提交概览（按学生聚合，教师视图）
export function useSubmissionSummary(
  homeworkId: string,
  params?: { page?: number; size?: number },
) {
  return useQuery({
    queryKey: submissionKeys.summary(homeworkId, params),
    queryFn: () => submissionService.getSummary(homeworkId, params),
    enabled: !!homeworkId,
  });
}

// 新增：获取某学生的提交历史（教师视图）
export function useUserSubmissionsForTeacher(
  homeworkId: string,
  userId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: submissionKeys.userSubmissions(homeworkId, userId),
    queryFn: () =>
      submissionService.getUserSubmissionsForTeacher(homeworkId, userId),
    enabled: !!homeworkId && !!userId && enabled,
  });
}

// Mutations
export function useCreateSubmission(homeworkId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmissionCreateInput) =>
      submissionService.create(homeworkId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: submissionKeys.my(homeworkId),
      });
      queryClient.invalidateQueries({
        queryKey: submissionKeys.myLatest(homeworkId),
      });
      queryClient.invalidateQueries({ queryKey: submissionKeys.lists() });
    },
  });
}

export function useDeleteSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submissionId: string) =>
      submissionService.delete(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.all });
    },
  });
}
