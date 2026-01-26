import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/stores/useUserStore";
import { userService } from "../services/userService";

// Query Keys
export const userKeys = {
  all: ["users"] as const,
  myStats: () => [...userKeys.all, "my-stats"] as const,
};

/**
 * 获取当前用户综合统计
 * 包含班级数、作业统计、待批改数等
 */
export function useUserStats() {
  const currentUser = useCurrentUser();
  const userId = currentUser?.id;

  return useQuery({
    queryKey: [...userKeys.myStats(), userId] as const,
    queryFn: () => userService.getMyStats(),
    enabled: !!userId,
    staleTime: 60 * 1000, // 1分钟过期
  });
}
