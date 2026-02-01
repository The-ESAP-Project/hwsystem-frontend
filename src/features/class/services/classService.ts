import api from "@/lib/api";
import { AppConfig } from "@/lib/appConfig";
import { downloadBlob } from "@/lib/download";
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

// API 响应类型
// ClassDetail 已包含 teacher: TeacherInfo, member_count 等字段
export type ClassDetailStringified = ClassDetail & {
  // 当前用户在该班级的角色（后端在认证请求时附加）
  my_role?: ClassUserRole;
};

export type ClassTeacherStringified = TeacherInfo;

export interface ClassListResponseStringified {
  items: ClassDetailStringified[];
  pagination?: ClassListResponse["pagination"];
}

// 成员相关类型
export type ClassMember = ClassUserDetail;
export type ClassMemberUser = UserInfo;
export type ClassMemberListResponse = ClassUserDetailListResponse;

export const classService = {
  // 获取班级列表
  list: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
  }) => {
    const { data } = await api.get<{ data: ClassListResponseStringified }>(
      "/classes",
      { params },
    );
    return data.data;
  },

  // 通过邀请码查询班级
  getByCode: async (code: string) => {
    const { data } = await api.get<{ data: ClassDetailStringified }>(
      `/classes/code/${code}`,
    );
    return data.data;
  },

  // 获取班级详情
  get: async (classId: string) => {
    const { data } = await api.get<{ data: ClassDetailStringified }>(
      `/classes/${classId}`,
    );
    return data.data;
  },

  // 创建班级
  create: async (req: {
    name: string;
    description?: string | null;
    teacher_id?: string | null;
  }) => {
    const { data } = await api.post<{ data: ClassDetailStringified }>(
      "/classes",
      req,
    );
    return data.data;
  },

  // 更新班级
  update: async (classId: string, req: UpdateClassRequest) => {
    const { data } = await api.put<{ data: ClassDetailStringified }>(
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
    params?: {
      page?: number;
      page_size?: number;
      search?: string;
      role?: string;
    },
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

  // 退出班级（学生自行退出）
  leaveClass: async (classId: string, userId: string) => {
    await api.delete(`/classes/${classId}/students/${userId}`);
  },

  // 导出班级报表
  exportClassReport: async (classId: string) => {
    const response = await api.get(`/classes/${classId}/export`, {
      responseType: "blob",
      timeout: AppConfig.fileOperationTimeout,
    });
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    // 从 Content-Disposition 获取文件名，或使用默认文件名
    const contentDisposition = response.headers["content-disposition"];
    let filename = `class_${classId}_report.xlsx`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match) {
        filename = match[1];
      }
    }
    downloadBlob(blob, filename);
  },
};
