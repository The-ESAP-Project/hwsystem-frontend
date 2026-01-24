import api from "@/lib/api";
import type { Stringify } from "@/types";
import type {
  ClassDetail,
  ClassListResponse,
  ClassUserDetail,
  ClassUserDetailListResponse,
  ClassUserRole,
  JoinClassRequest,
  TeacherInfo,
  UpdateClassRequest,
  UserInfo,
} from "@/types/generated";

// 使用生成的类型 + Stringify 转换
export type ClassWithDetails = Stringify<ClassDetail> & {
  my_role?: ClassUserRole;
};

export type ClassTeacher = Stringify<TeacherInfo>;

export interface ClassListResponseWithDetails {
  items: ClassWithDetails[];
  pagination?: Stringify<ClassListResponse>["pagination"];
}

// 成员相关类型 - 使用生成的类型
export type ClassMember = Stringify<ClassUserDetail>;
export type ClassMemberUser = Stringify<UserInfo>;
export type ClassMemberListResponse = Stringify<ClassUserDetailListResponse>;

export const classService = {
  // 获取班级列表
  list: async (params?: { page?: number; page_size?: number }) => {
    const { data } = await api.get<{ data: ClassListResponseWithDetails }>(
      "/classes",
      { params },
    );
    return data.data;
  },

  // 通过邀请码查询班级
  getByCode: async (code: string) => {
    const { data } = await api.get<{ data: ClassWithDetails }>(
      `/classes/code/${code}`,
    );
    return data.data;
  },

  // 获取班级详情
  get: async (classId: string) => {
    const { data } = await api.get<{ data: ClassWithDetails }>(
      `/classes/${classId}`,
    );
    return data.data;
  },

  // 创建班级
  create: async (req: { name: string; description?: string | null }) => {
    const { data } = await api.post<{ data: ClassWithDetails }>(
      "/classes",
      req,
    );
    return data.data;
  },

  // 更新班级
  update: async (classId: string, req: Stringify<UpdateClassRequest>) => {
    const { data } = await api.put<{ data: ClassWithDetails }>(
      `/classes/${classId}`,
      req,
    );
    return data.data;
  },

  // 删除班级
  delete: async (classId: string) => {
    await api.delete(`/classes/${classId}`);
  },

  // 加入班级
  join: async (inviteCode: string) => {
    // 先通过邀请码获取班级信息
    const classInfo = await classService.getByCode(inviteCode);
    // 然后加入班级
    const { data } = await api.post<{ data: ClassMember }>(
      `/classes/${classInfo.id}/students`,
      { invite_code: inviteCode } as JoinClassRequest,
    );
    return data.data;
  },

  // 获取班级成员列表
  getMembers: async (
    classId: string,
    params?: { page?: number; page_size?: number },
  ) => {
    const { data } = await api.get<{
      data: ClassMemberListResponse;
    }>(`/classes/${classId}/students`, { params });
    return data.data;
  },

  // 修改成员角色
  updateMemberRole: async (
    classId: string,
    userId: string,
    role: "student" | "class_representative",
  ) => {
    const { data } = await api.put<{ data: ClassMember }>(
      `/classes/${classId}/students/${userId}`,
      { role },
    );
    return data.data;
  },

  // 移除成员
  removeMember: async (classId: string, userId: string) => {
    await api.delete(`/classes/${classId}/students/${userId}`);
  },
};
