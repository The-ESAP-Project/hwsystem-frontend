import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Stringify } from "@/types";
import type { UpdateClassRequest } from "@/types/generated";
import { classService } from "../services/classService";

// Query Keys
export const classKeys = {
  all: ["classes"] as const,
  lists: () => [...classKeys.all, "list"] as const,
  list: (params?: { page?: number; page_size?: number }) =>
    [...classKeys.lists(), params] as const,
  details: () => [...classKeys.all, "detail"] as const,
  detail: (id: string) => [...classKeys.details(), id] as const,
  byCode: (code: string) => [...classKeys.all, "code", code] as const,
  members: (classId: string) => [...classKeys.all, classId, "members"] as const,
};

// Queries
export function useClassList(params?: { page?: number; page_size?: number }) {
  return useQuery({
    queryKey: classKeys.list(params),
    queryFn: () => classService.list(params),
  });
}

export function useClass(classId: string) {
  return useQuery({
    queryKey: classKeys.detail(classId),
    queryFn: () => classService.get(classId),
    enabled: !!classId,
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
  params?: { page?: number; page_size?: number },
) {
  return useQuery({
    queryKey: classKeys.members(classId),
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
      queryClient.invalidateQueries({ queryKey: classKeys.members(classId) });
    },
  });
}

export function useRemoveMember(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => classService.removeMember(classId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.members(classId) });
    },
  });
}
