import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type CreateHomeworkInput,
  homeworkService,
  type UpdateHomeworkInput,
  type HomeworkListItemStringified,
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
  },
) {
  return useQuery({
    queryKey: homeworkKeys.list(classId, params),
    queryFn: () => homeworkService.list(classId, params),
    enabled: !!classId,
  });
}

export function useHomework(homeworkId: string) {
  return useQuery({
    queryKey: homeworkKeys.detail(homeworkId),
    queryFn: () => homeworkService.get(homeworkId),
    enabled: !!homeworkId,
  });
}

export function useHomeworkStats(homeworkId: string) {
  return useQuery({
    queryKey: homeworkKeys.stats(homeworkId),
    queryFn: () => homeworkService.getStats(homeworkId),
    enabled: !!homeworkId,
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
    },
  });
}

// 获取多个班级的作业列表（用于用户仪表盘）
export function useAllClassesHomeworks(classIds: string[]) {
  return useQueries({
    queries: classIds.map((classId) => ({
      queryKey: homeworkKeys.list(classId, { page_size: 100 }),
      queryFn: () => homeworkService.list(classId, { page_size: 100 }),
      enabled: !!classId,
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
