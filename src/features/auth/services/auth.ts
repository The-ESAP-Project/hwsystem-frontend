import api from "@/lib/api";
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  User,
} from "@/types/generated";

interface VerifyResult {
  isValid: boolean;
  isNetworkError: boolean;
  error?: { code: number; message: string };
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>(
      "/auth/login",
      credentials,
    );
    return response.data.data!;
  },

  async register(data: { username: string; email: string; password: string }) {
    const response = await api.post<ApiResponse<User>>("/auth/register", data);
    return response.data.data!;
  },

  async verifyToken(): Promise<VerifyResult> {
    try {
      await api.get("/auth/verify-token");
      return { isValid: true, isNetworkError: false };
    } catch (error: unknown) {
      const err = error as { code?: number; message?: string };
      const isNetworkError =
        err.code === -1 ||
        Boolean(err.message?.includes("网络")) ||
        Boolean(err.message?.includes("Network"));

      return {
        isValid: false,
        isNetworkError,
        error: {
          code: err.code ?? -1,
          message: err.message ?? "Unknown error",
        },
      };
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>("/auth/me");
    return response.data.data!;
  },

  async refreshToken(): Promise<{ access_token: string; expires_in: string }> {
    const response = await api.post("/auth/refresh");
    return response.data.data!;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },
};
