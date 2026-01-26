import i18n from "@/app/i18n";
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

/** 错误码→i18n key 映射 */
const errorCodeToI18nKey: Partial<Record<ErrorCode, string>> = {
  // 通用
  [ErrorCode.BadRequest]: "error.badRequest",
  [ErrorCode.Unauthorized]: "error.unauthorized",
  [ErrorCode.Forbidden]: "error.forbidden",
  [ErrorCode.NotFound]: "error.notFoundResource",
  [ErrorCode.InternalServerError]: "error.serverError",
  [ErrorCode.Conflict]: "error.conflict",
  [ErrorCode.RateLimitExceeded]: "error.rateLimitExceeded",
  // 认证
  [ErrorCode.AuthFailed]: "error.authFailed",
  [ErrorCode.RegisterFailed]: "error.registerFailed",
  [ErrorCode.PasswordPolicyViolation]: "error.passwordPolicyViolation",
  // 文件
  [ErrorCode.FileNotFound]: "error.fileNotFound",
  [ErrorCode.FileUploadFailed]: "error.fileUploadFailed",
  [ErrorCode.FileTypeNotAllowed]: "error.fileTypeNotAllowed",
  [ErrorCode.FileSizeExceeded]: "error.fileSizeExceeded",
  [ErrorCode.MultifileUploadNotAllowed]: "error.multifileUploadNotAllowed",
  // 用户
  [ErrorCode.UserNotFound]: "error.userNotFound",
  [ErrorCode.UserAlreadyExists]: "error.userAlreadyExists",
  [ErrorCode.UserUpdateFailed]: "error.userUpdateFailed",
  [ErrorCode.UserDeleteFailed]: "error.userDeleteFailed",
  [ErrorCode.UserCreationFailed]: "error.userCreationFailed",
  [ErrorCode.CanNotDeleteCurrentUser]: "error.canNotDeleteCurrentUser",
  [ErrorCode.UserNameInvalid]: "error.userNameInvalid",
  [ErrorCode.UserNameAlreadyExists]: "error.userNameAlreadyExists",
  [ErrorCode.UserEmailInvalid]: "error.userEmailInvalid",
  [ErrorCode.UserEmailAlreadyExists]: "error.userEmailAlreadyExists",
  // 班级
  [ErrorCode.ClassNotFound]: "error.classNotFound",
  [ErrorCode.ClassAlreadyExists]: "error.classAlreadyExists",
  [ErrorCode.ClassCreationFailed]: "error.classCreationFailed",
  [ErrorCode.ClassUpdateFailed]: "error.classUpdateFailed",
  [ErrorCode.ClassDeleteFailed]: "error.classDeleteFailed",
  [ErrorCode.ClassPermissionDenied]: "error.classPermissionDenied",
  [ErrorCode.ClassJoinFailed]: "error.classJoinFailed",
  [ErrorCode.ClassInviteCodeInvalid]: "error.classInviteCodeInvalid",
  [ErrorCode.ClassAlreadyJoined]: "error.classAlreadyJoined",
  [ErrorCode.ClassJoinForbidden]: "error.classJoinForbidden",
  [ErrorCode.ClassUserNotFound]: "error.classUserNotFound",
  // 导入/导出
  [ErrorCode.ImportFileParseFailed]: "error.importFileParseFailed",
  [ErrorCode.ImportFileFormatInvalid]: "error.importFileFormatInvalid",
  [ErrorCode.ImportFileMissingColumn]: "error.importFileMissingColumn",
  [ErrorCode.ImportFileDataInvalid]: "error.importFileDataInvalid",
  [ErrorCode.ExportFailed]: "error.exportFailed",
  // 作业
  [ErrorCode.HomeworkNotFound]: "error.homeworkNotFound",
  [ErrorCode.HomeworkCreateFailed]: "error.homeworkCreateFailed",
  [ErrorCode.HomeworkUpdateFailed]: "error.homeworkUpdateFailed",
  [ErrorCode.HomeworkDeleteFailed]: "error.homeworkDeleteFailed",
  // 提交
  [ErrorCode.SubmissionNotFound]: "error.submissionNotFound",
  [ErrorCode.SubmissionCreateFailed]: "error.submissionCreateFailed",
  [ErrorCode.SubmissionDeleteFailed]: "error.submissionDeleteFailed",
  // 成绩
  [ErrorCode.GradeNotFound]: "error.gradeNotFound",
  [ErrorCode.GradeCreateFailed]: "error.gradeCreateFailed",
  [ErrorCode.GradeUpdateFailed]: "error.gradeUpdateFailed",
  // 通知
  [ErrorCode.NotificationNotFound]: "error.notificationNotFound",
};

/** 获取友好错误消息 */
export function getErrorMessage(code: number, fallback?: string): string {
  const i18nKey = errorCodeToI18nKey[code as ErrorCode];
  if (i18nKey) {
    return i18n.t(i18nKey);
  }
  return fallback ?? i18n.t("error.default");
}
