import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { useUserStore } from "@/stores/useUserStore";
import type { ApiResponse } from "@/types/generated";
import { type ApiError, getErrorMessage } from "./errors";

// 用于防止并发刷新
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  for (const callback of refreshSubscribers) {
    callback(token);
  }
  refreshSubscribers = [];
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

      // 如果正在刷新，等待刷新完成后重试
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api.request(originalRequest));
          });
        });
      }

      isRefreshing = true;

      // 使用 axios 直接调用 refresh 端点，避免循环依赖
      return axios
        .post<ApiResponse<{ access_token: string; expires_in: number }>>(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true },
        )
        .then((response) => {
          const { access_token, expires_in } = response.data.data!;
          localStorage.setItem("authToken", access_token);
          localStorage.setItem("tokenExpiresIn", expires_in.toString());
          onTokenRefreshed(access_token);

          // 重试原请求
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api.request(originalRequest);
        })
        .catch((refreshError) => {
          useUserStore.getState().clearAuthData();
          window.dispatchEvent(new CustomEvent("auth:unauthorized"));
          return Promise.reject(refreshError);
        })
        .finally(() => {
          isRefreshing = false;
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
