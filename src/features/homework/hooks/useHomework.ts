import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { gradeKeys } from "@/features/grade/hooks/useGrade";
import { submissionKeys } from "@/features/submission/hooks/useSubmission";
import { useCurrentUser } from "@/stores/useUserStore";
import {
  type CreateHomeworkInput,
  type HomeworkListItemStringified,
  homeworkService,
  type UpdateHomeworkInput,
} from "../services/homeworkService";

// Query Keys
export const homeworkKeys = {
  all: ["homeworks"] as const,
  lists: () => [...homeworkKeys.all, "list"] as const,
  list: (
    classId: string,
    params?: {
      page?: number;
      page_size?: number;
      status?: string;
      search?: string;
      created_by?: string;
      include_stats?: boolean;
    },
  ) => [...homeworkKeys.lists(), classId, params] as const,
  details: () => [...homeworkKeys.all, "detail"] as const,
  detail: (homeworkId: string) =>
    [...homeworkKeys.details(), homeworkId] as const,
  stats: (homeworkId: string) =>
    [...homeworkKeys.all, homeworkId, "stats"] as const,
};

// Queries
export function useHomeworkList(
  classId: string,
  params?: {
    page?: number;
    page_size?: number;
    status?: string;
    search?: string;
    created_by?: string;
    include_stats?: boolean;
  },
) {
  const currentUser = useCurrentUser();
  const userId = currentUser?.id;
  
  return useQuery({
    queryKey: [...homeworkKeys.list(classId, params), userId] as const,
    queryFn: () => homeworkService.list(classId, params),
    enabled: !!classId && !!userId,
  });
}

export function useHomework(homeworkId: string) {
  const currentUser = useCurrentUser();
  const userId = currentUser?.id;
  
  return useQuery({
    queryKey: [...homeworkKeys.detail(homeworkId), userId] as const,
    queryFn: () => homeworkService.get(homeworkId),
    enabled: !!homeworkId && !!userId,
  });
}

export function useHomeworkStats(homeworkId: string) {
  return useQuery({
    queryKey: homeworkKeys.stats(homeworkId),
    queryFn: () => homeworkService.getStats(homeworkId),
    enabled: !!homeworkId,
    staleTime: 30 * 1000, // 30秒过期
    refetchOnMount: "always", // 总是在挂载时重新获取
  });
}

// Mutations
export function useCreateHomework(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHomeworkInput) =>
      homeworkService.create(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
    },
  });
}

export function useUpdateHomework(homeworkId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateHomeworkInput) =>
      homeworkService.update(homeworkId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: homeworkKeys.detail(homeworkId),
      });
      queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
    },
  });
}

export function useDeleteHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (homeworkId: string) => homeworkService.delete(homeworkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
      // 清理关联的提交和评分缓存
      queryClient.invalidateQueries({ queryKey: submissionKeys.all });
      queryClient.invalidateQueries({ queryKey: gradeKeys.all });
    },
  });
}

// 获取多个班级的作业列表（用于用户仪表盘）
export function useAllClassesHomeworks(
  classIds: string[],
  options?: { include_stats?: boolean },
) {
  const currentUser = useCurrentUser();
  const userId = currentUser?.id;
  
  return useQueries({
    queries: classIds.map((classId) => ({
      queryKey: [
        ...homeworkKeys.list(classId, {
          page_size: 100,
          include_stats: options?.include_stats,
        }),
        userId,
      ] as const,
      queryFn: () =>
        homeworkService.list(classId, {
          page_size: 100,
          include_stats: options?.include_stats,
        }),
      enabled: !!classId && !!userId,
    })),
    combine: (results) => {
      const allHomeworks: HomeworkListItemStringified[] = [];
      let isLoading = false;

      for (const result of results) {
        if (result.isLoading) isLoading = true;
        if (result.data?.items) {
          allHomeworks.push(...result.data.items);
        }
      }

      return {
        data: allHomeworks,
        isLoading,
      };
    },
  });
}
