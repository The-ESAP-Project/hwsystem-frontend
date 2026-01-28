import api from "@/lib/api";
import type { Stringify } from "@/types";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UserExportParams,
  UserImportResponse,
  UserListResponse,
  UserResponse,
  UserRole,
  UserStatus,
} from "@/types/generated";

// API 响应类型 - 直接使用生成类型的 Stringify 版本
export type UserDetail = Stringify<User>;
export type UserListResponseStringified = Stringify<UserListResponse>;
export type UserImportResponseStringified = Stringify<UserImportResponse>;

// 前端友好的查询参数类型
export interface UserListParamsInput {
  page?: number;
  size?: number;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

export const userService = {
  list: async (
    params: UserListParamsInput = {},
  ): Promise<UserListResponseStringified> => {
    const { data } = await api.get<{ data: Stringify<UserListResponse> }>(
      "/users",
      {
        params,
      },
    );
    return data.data;
  },

  get: async (id: string): Promise<UserDetail> => {
    const { data } = await api.get<{ data: Stringify<UserResponse> }>(
      `/users/${id}`,
    );
    return data.data.user;
  },

  create: async (createData: CreateUserRequest): Promise<UserDetail> => {
    const response = await api.post<{ data: Stringify<UserResponse> }>(
      "/users",
      createData,
    );
    return response.data.data.user;
  },

  update: async (
    id: string,
    updateData: UpdateUserRequest,
  ): Promise<UserDetail> => {
    const response = await api.put<{ data: Stringify<UserResponse> }>(
      `/users/${id}`,
      updateData,
    );
    return response.data.data.user;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  // 导出用户
  export: async (params: UserExportParams): Promise<Blob> => {
    const response = await api.get(`/users/export`, {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  // 导入用户
  import: async (file: File): Promise<UserImportResponseStringified> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{
      data: Stringify<UserImportResponse>;
    }>("/users/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  },

  // 下载导入模板
  downloadTemplate: async (format: "csv" | "xlsx" = "csv"): Promise<Blob> => {
    const response = await api.get(`/users/import/template`, {
      params: { format },
      responseType: "blob",
    });
    return response.data;
  },
};

export type {
  UserRole,
  UserStatus,
  CreateUserRequest,
  UpdateUserRequest,
  UserExportParams,
};
