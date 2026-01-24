import { ErrorCode } from "@/types/generated";

/** API 错误对象类型 */
export interface ApiError {
  code: ErrorCode | number;
  message: string;
  timestamp?: string;
}

/** 类型守卫 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}

/** 错误码→友好消息映射 */
const errorMessages: Partial<Record<ErrorCode, string>> = {
  // 通用
  [ErrorCode.BadRequest]: "请求参数错误",
  [ErrorCode.Unauthorized]: "请先登录",
  [ErrorCode.Forbidden]: "权限不足",
  [ErrorCode.NotFound]: "资源不存在",
  [ErrorCode.InternalServerError]: "服务器内部错误，请稍后重试",
  [ErrorCode.Conflict]: "资源冲突",
  [ErrorCode.RateLimitExceeded]: "请求过于频繁，请稍后再试",
  // 认证
  [ErrorCode.AuthFailed]: "用户名或密码错误",
  [ErrorCode.RegisterFailed]: "注册失败，请重试",
  [ErrorCode.PasswordPolicyViolation]:
    "密码不符合要求（需包含大小写字母和数字，至少8位）",
  // 文件
  [ErrorCode.FileNotFound]: "文件不存在",
  [ErrorCode.FileUploadFailed]: "文件上传失败",
  [ErrorCode.FileTypeNotAllowed]: "不支持的文件类型",
  [ErrorCode.FileSizeExceeded]: "文件大小超出限制",
  [ErrorCode.MuitifileUploadNotAllowed]: "不支持多文件上传",
  // 用户
  [ErrorCode.UserNotFound]: "用户不存在",
  [ErrorCode.UserAlreadyExists]: "用户已存在",
  [ErrorCode.UserUpdateFailed]: "用户信息更新失败",
  [ErrorCode.UserDeleteFailed]: "用户删除失败",
  [ErrorCode.UserCreationFailed]: "用户创建失败",
  [ErrorCode.CanNotDeleteCurrentUser]: "不能删除当前登录用户",
  [ErrorCode.UserNameInvalid]: "用户名格式无效",
  [ErrorCode.UserNameAlreadyExists]: "用户名已被占用",
  [ErrorCode.UserEmailInvalid]: "邮箱格式无效",
  [ErrorCode.UserEmailAlreadyExists]: "邮箱已被占用",
  // 班级
  [ErrorCode.ClassNotFound]: "班级不存在",
  [ErrorCode.ClassAlreadyExists]: "班级已存在",
  [ErrorCode.ClassCreationFailed]: "班级创建失败",
  [ErrorCode.ClassUpdateFailed]: "班级更新失败",
  [ErrorCode.ClassDeleteFailed]: "班级删除失败",
  [ErrorCode.ClassPermissionDenied]: "无权操作该班级",
  [ErrorCode.ClassJoinFailed]: "加入班级失败",
  [ErrorCode.ClassInviteCodeInvalid]: "邀请码无效",
  [ErrorCode.ClassAlreadyJoined]: "已加入该班级",
  [ErrorCode.ClassJoinForbidden]: "不允许加入该班级",
  [ErrorCode.ClassUserNotFound]: "班级成员不存在",
};

/** 获取友好错误消息 */
export function getErrorMessage(code: number, fallback?: string): string {
  return errorMessages[code as ErrorCode] ?? fallback ?? "操作失败，请稍后重试";
}
