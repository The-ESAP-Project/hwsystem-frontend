import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import i18n from "@/app/i18n";
import { useUserStore } from "@/stores/useUserStore";
import type { ApiResponse } from "@/types/generated";
import { ErrorCode } from "@/types/generated/error_code";
import { getApiBaseUrl } from "./config";
import { API_TIMEOUT } from "./constants";
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
  baseURL: getApiBaseUrl(),
  timeout: API_TIMEOUT,
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
    // Blob 响应直接放行（文件下载）
    if (response.config.responseType === "blob") {
      return response;
    }

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

    // 401 未授权 - 需要区分业务错误和 token 过期
    if (error.response?.status === 401 && originalRequest) {
      const unauthorizedError: ApiError = {
        code: 401,
        message: getErrorMessage(401),
      };

      // 避免 refresh 端点本身失败时无限循环（优先判断，不走业务错误分支）
      if (originalRequest.url?.includes("/auth/refresh")) {
        useUserStore.getState().clearAuthData();
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
        return Promise.reject(unauthorizedError);
      }

      // 检查响应体，看是否是业务错误（如登录失败）
      // 排除 Unauthorized(1001)，它代表 token 过期，应走刷新逻辑
      const responseData = error.response.data as
        | ApiResponse<unknown>
        | undefined;
      if (
        responseData?.code &&
        responseData.code !== 0 &&
        responseData.code !== ErrorCode.Unauthorized
      ) {
        // 业务错误（如 AuthFailed = 2000），直接构造 ApiError 返回
        const apiError: ApiError = {
          code: responseData.code,
          message: getErrorMessage(responseData.code, responseData.message),
          timestamp: responseData.timestamp,
        };
        return Promise.reject(apiError);
      }

      // 避免重复重试
      if (originalRequest._retry) {
        useUserStore.getState().clearAuthData();
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
        return Promise.reject(unauthorizedError);
      }

      originalRequest._retry = true;

      // 使用 Promise 链式管理，多个请求共享同一个刷新 Promise
      return getRefreshToken()
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api.request(originalRequest);
        })
        .catch(() => {
          useUserStore.getState().clearAuthData();
          window.dispatchEvent(new CustomEvent("auth:unauthorized"));
          return Promise.reject(unauthorizedError);
        });
    }

    // 网络错误
    if (!error.response) {
      return Promise.reject({
        code: -1,
        message: i18n.t("error.network"),
      });
    }

    // 其他 HTTP 错误 - 优先从响应体获取业务错误码
    const errorData = error.response.data as ApiResponse<unknown> | undefined;
    if (errorData?.code && errorData.code !== 0) {
      return Promise.reject({
        code: errorData.code,
        message: getErrorMessage(errorData.code, errorData.message),
        timestamp: errorData.timestamp,
      });
    }

    // 无业务错误码时 fallback 到 HTTP 状态码
    return Promise.reject({
      code: error.response.status,
      message: getErrorMessage(error.response.status, error.message),
    });
  },
);

export default api;
