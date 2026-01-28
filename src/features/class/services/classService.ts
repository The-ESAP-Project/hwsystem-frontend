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

// API 响应类型 - 直接使用生成类型的 Stringify 版本
// ClassDetail 已包含 teacher: TeacherInfo, member_count 等字段
export type ClassDetailStringified = Stringify<ClassDetail> & {
  // 当前用户在该班级的角色（后端在认证请求时附加）
  my_role?: ClassUserRole;
};

export type ClassTeacherStringified = Stringify<TeacherInfo>;

export interface ClassListResponseStringified {
  items: ClassDetailStringified[];
  pagination?: Stringify<ClassListResponse>["pagination"];
}

// 成员相关类型 - 直接使用生成类型的 Stringify 版本
export type ClassMember = Stringify<ClassUserDetail>;
export type ClassMemberUser = Stringify<UserInfo>;
export type ClassMemberListResponse = Stringify<ClassUserDetailListResponse>;

export const classService = {
  // 获取班级列表
  list: async (params?: {
    page?: number;
    size?: number;
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
    teacher_id?: number | null;
  }) => {
    const { data } = await api.post<{ data: ClassDetailStringified }>(
      "/classes",
      req,
    );
    return data.data;
  },

  // 更新班级
  update: async (classId: string, req: Stringify<UpdateClassRequest>) => {
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
      size?: number;
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
    });
    // 触发下载
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    // 从 Content-Disposition 获取文件名，或使用默认文件名
    const contentDisposition = response.headers["content-disposition"];
    let filename = `class_${classId}_report.xlsx`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match) {
        filename = match[1];
      }
    }
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
