import api from "@/lib/api";
import { AppConfig } from "@/lib/appConfig";
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

// API 响应类型
export type UserDetail = User;
export type UserListResponseStringified = UserListResponse;
export type UserImportResponseStringified = UserImportResponse;

// 前端友好的查询参数类型（使用 page_size 而非 size）
export interface UserListParamsInput {
  page?: number;
  page_size?: number;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

export const adminUserService = {
  list: async (
    params: UserListParamsInput = {},
  ): Promise<UserListResponseStringified> => {
    const { data } = await api.get<{ data: UserListResponse }>("/users", {
      params,
    });
    return data.data;
  },

  get: async (id: string): Promise<UserDetail> => {
    const { data } = await api.get<{ data: UserResponse }>(`/users/${id}`);
    return data.data.user;
  },

  create: async (createData: CreateUserRequest): Promise<UserDetail> => {
    const response = await api.post<{ data: UserResponse }>(
      "/users",
      createData,
    );
    return response.data.data.user;
  },

  update: async (
    id: string,
    updateData: UpdateUserRequest,
  ): Promise<UserDetail> => {
    const response = await api.put<{ data: UserResponse }>(
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
      timeout: AppConfig.fileOperationTimeout,
    });
    return response.data;
  },

  // 导入用户
  import: async (file: File): Promise<UserImportResponseStringified> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{ data: UserImportResponse }>(
      "/users/import",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: AppConfig.fileOperationTimeout,
      },
    );
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
