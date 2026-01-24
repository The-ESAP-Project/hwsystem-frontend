import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { submissionKeys } from "@/features/submission/hooks/useSubmission";
import type { UpdateGradeRequest } from "@/types/generated";
import { type CreateGradeInput, gradeService } from "../services/gradeService";

// Query Keys
export const gradeKeys = {
  all: ["grades"] as const,
  detail: (submissionId: string) => [...gradeKeys.all, submissionId] as const,
};

// Queries
export function useGrade(submissionId: string) {
  return useQuery({
    queryKey: gradeKeys.detail(submissionId),
    queryFn: async () => {
      try {
        return await gradeService.get(submissionId);
      } catch (error: unknown) {
        // 404 表示该提交尚未评分，返回 undefined 而不是抛错
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
    enabled: !!submissionId,
  });
}

// Mutations
export function useCreateGrade(submissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGradeInput) =>
      gradeService.create(submissionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: gradeKeys.detail(submissionId),
      });
      queryClient.invalidateQueries({ queryKey: submissionKeys.lists() });
    },
  });
}

export function useUpdateGrade(gradeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateGradeRequest) =>
      gradeService.update(gradeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.all });
      queryClient.invalidateQueries({ queryKey: submissionKeys.lists() });
    },
  });
}
