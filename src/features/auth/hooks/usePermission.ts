import { useCurrentUser } from "@/stores/useUserStore";

/**
 * 权限判断 Hook
 */
export function usePermission() {
  const user = useCurrentUser();
  const role = user?.role;

  return {
    // 角色判断
    isAdmin: role === "admin",
    isTeacher: role === "teacher" || role === "admin",
    isUser: role === "user",

    // 权限判断
    canManageUsers: role === "admin",
    canCreateClass: role === "teacher" || role === "admin",
    canManageClass: role === "teacher" || role === "admin",
    canGradeSubmission: role === "teacher" || role === "admin",
    canViewAllSubmissions: role === "teacher" || role === "admin",
    canDeleteHomework: role === "teacher" || role === "admin",
  };
}

/**
 * 检查用户是否有指定角色
 */
export function useHasRole(roles: string[]) {
  const user = useCurrentUser();
  return user ? roles.includes(user.role) : false;
}
