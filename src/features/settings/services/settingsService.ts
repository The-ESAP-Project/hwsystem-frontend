import api from "@/lib/api";
import type {
  ApiResponse,
  UpdateProfileRequest,
  User,
  UserResponse,
} from "@/types/generated";

// 前端友好的输入类型（所有字段可选）
export type UpdateProfileInput = Partial<UpdateProfileRequest>;

export const settingsService = {
  async updateProfile(data: UpdateProfileInput): Promise<User> {
    const response = await api.put<ApiResponse<UserResponse>>("/auth/me", data);
    return response.data.data!.user;
  },
};
