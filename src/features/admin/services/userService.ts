import api from "@/lib/api";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UserListResponse,
  UserRole,
  UserStatus,
} from "@/types/generated";

// 前端 API 参数格式（与 generated UserListQuery 的 size 字段不同，前端用 page_size）
export interface UserListParams {
  page?: number;
  page_size?: number;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

// 扩展 User 类型，将 bigint id 转为 string
export interface UserWithStringId extends Omit<User, "id"> {
  id: string;
}

export interface UserListResponseWithStringIds {
  items: UserWithStringId[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

// 转换函数：将 bigint id 转为 string
function transformUser(user: User): UserWithStringId {
  return {
    ...user,
    id: String(user.id),
  };
}

function transformUserListResponse(
  response: UserListResponse,
): UserListResponseWithStringIds {
  return {
    items: response.items.map(transformUser),
    pagination: {
      page: Number(response.pagination.page),
      page_size: Number(response.pagination.size),
      total: Number(response.pagination.total),
      total_pages: Number(response.pagination.pages),
    },
  };
}

export const userService = {
  list: async (
    params: UserListParams = {},
  ): Promise<UserListResponseWithStringIds> => {
    const { data } = await api.get<{ data: UserListResponse }>("/users", {
      params,
    });
    return transformUserListResponse(data.data);
  },

  get: async (id: string): Promise<UserWithStringId> => {
    const { data } = await api.get<{ data: User }>(`/users/${id}`);
    return transformUser(data.data);
  },

  create: async (data: CreateUserRequest): Promise<UserWithStringId> => {
    const response = await api.post<{ data: User }>("/users", data);
    return transformUser(response.data.data);
  },

  update: async (
    id: string,
    updateData: UpdateUserRequest,
  ): Promise<UserWithStringId> => {
    const response = await api.put<{ data: User }>(`/users/${id}`, updateData);
    return transformUser(response.data.data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

export type { UserRole, UserStatus, CreateUserRequest, UpdateUserRequest };
