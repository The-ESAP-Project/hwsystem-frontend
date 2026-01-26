import { useCurrentUser } from "@/stores/useUserStore";
import type { ClassUserRole } from "@/types/generated/class-user";

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

/**
 * 班级内权限判断 Hook
 * @param classRole 用户在班级中的角色
 */
export function useClassPermission(classRole?: ClassUserRole | null) {
  const { isAdmin, isTeacher } = usePermission();

  // 系统级教师/管理员权限
  const hasSystemTeacherRole = isTeacher || isAdmin;

  // 班级内角色判断
  const isClassTeacher = classRole === "teacher" || hasSystemTeacherRole;
  const isClassRepresentative = classRole === "class_representative";

  return {
    /** 是否是班级教师（包括系统教师/管理员） */
    isClassTeacher,
    /** 是否是课代表 */
    isClassRepresentative,
    /** 是否能管理班级成员（教师或管理员） */
    canManageClassMembers: isClassTeacher,
    /** 是否能查看班级统计（教师、课代表、管理员） */
    canViewClassStats: isClassTeacher || isClassRepresentative,
    /** 是否能在班级内批改（教师或管理员，课代表不能批改） */
    canGradeInClass: isClassTeacher,
    /** 是否能创建作业（教师或管理员） */
    canCreateHomework: isClassTeacher,
    /** 是否能删除作业（教师或管理员） */
    canDeleteHomework: isClassTeacher,
  };
}
