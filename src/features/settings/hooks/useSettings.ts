import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userKeys } from "@/features/admin/hooks/useUsers";
import { classKeys } from "@/features/class/hooks/useClass";
import { homeworkKeys } from "@/features/homework/hooks/useHomework";
import { submissionKeys } from "@/features/submission/hooks/useSubmission";
import { useUserStore } from "@/stores/useUserStore";
import {
  settingsService,
  type UpdateProfileRequest,
} from "../services/settingsService";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) =>
      settingsService.updateProfile(data),
    onSuccess: (user) => {
      // 更新全局用户状态
      useUserStore.setState({ currentUser: user });

      // 失效用户详情缓存
      queryClient.invalidateQueries({ queryKey: userKeys.detail(user.id) });
      // 失效班级信息中的用户名称
      queryClient.invalidateQueries({ queryKey: classKeys.all });
      // 失效提交列表中的用户信息
      queryClient.invalidateQueries({ queryKey: submissionKeys.all });
      // 失效作业列表中的创建者信息
      queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
    },
  });
}
