import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { useUserStore } from "@/stores/useUserStore";
import type { ApiResponse } from "@/types/generated";
import { type ApiError, getErrorMessage } from "./errors";

// Token 刷新 Promise（用于防止并发刷新）
let refreshPromise: Promise<string> | null = null;

/**
 * 获取刷新后的 Token
 * 使用 Promise 链式管理，确保多个并发请求只触发一次刷新
 */
function getRefreshToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = axios
    .post<ApiResponse<{ access_token: string; expires_in: number }>>(
      `${api.defaults.baseURL}/auth/refresh`,
      {},
      { withCredentials: true },
    )
    .then((response) => {
      const { access_token, expires_in } = response.data.data!;
      localStorage.setItem("authToken", access_token);
      localStorage.setItem("tokenExpiresIn", expires_in.toString());
      return access_token;
    })
    .finally(() => {
      // 延迟清除 Promise，避免极短时间内的重复刷新
      setTimeout(() => {
        refreshPromise = null;
      }, 100);
    });

  return refreshPromise;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器：添加 Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 响应拦截器：处理业务状态码和错误
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    const { data } = response;

    // 业务成功
    if (data.code === 0) {
      return response;
    }

    // 业务错误
    const apiError: ApiError = {
      code: data.code,
      message: getErrorMessage(data.code, data.message),
      timestamp: data.timestamp,
    };
    return Promise.reject(apiError);
  },
  (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 401 未授权 - 尝试刷新 token
    if (error.response?.status === 401 && originalRequest) {
      // 避免 refresh 端点本身失败时无限循环
      if (originalRequest.url?.includes("/auth/refresh")) {
        useUserStore.getState().clearAuthData();
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
        return Promise.reject(error);
      }

      // 避免重复重试
      if (originalRequest._retry) {
        useUserStore.getState().clearAuthData();
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // 使用 Promise 链式管理，多个请求共享同一个刷新 Promise
      return getRefreshToken()
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api.request(originalRequest);
        })
        .catch((refreshError) => {
          useUserStore.getState().clearAuthData();
          window.dispatchEvent(new CustomEvent("auth:unauthorized"));
          return Promise.reject(refreshError);
        });
    }

    // 网络错误
    if (!error.response) {
      return Promise.reject({
        code: -1,
        message: "网络错误，请检查网络连接",
      });
    }

    // 其他 HTTP 错误
    return Promise.reject({
      code: error.response.status,
      message: error.message,
    });
  },
);

export default api;
