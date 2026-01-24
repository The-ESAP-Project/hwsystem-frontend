import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type CreateHomeworkInput,
  homeworkService,
  type UpdateHomeworkInput,
} from "../services/homeworkService";

// Query Keys
export const homeworkKeys = {
  all: ["homeworks"] as const,
  lists: () => [...homeworkKeys.all, "list"] as const,
  list: (
    classId: string,
    params?: { page?: number; page_size?: number; status?: string },
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
  params?: { page?: number; page_size?: number; status?: string },
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
