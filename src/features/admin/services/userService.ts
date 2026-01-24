import api from "@/lib/api";
import type { Stringify } from "@/types";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UserListResponse,
  UserResponse,
  UserRole,
  UserStatus,
} from "@/types/generated";

// 前端 API 参数格式
export interface UserListParams {
  page?: number;
  page_size?: number;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

// API 响应类型 - 直接使用生成类型的 Stringify 版本
export type UserDetail = Stringify<User>;
export type UserListResponseStringified = Stringify<UserListResponse>;

export const userService = {
  list: async (
    params: UserListParams = {},
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
};

export type { UserRole, UserStatus, CreateUserRequest, UpdateUserRequest };
