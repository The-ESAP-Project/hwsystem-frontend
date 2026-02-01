export interface FileValidationError {
  fileName: string;
  errorType: "size" | "type" | "empty" | "mismatch";
  maxSize?: number;
  actualSize?: number;
  allowedTypes?: string[];
  actualType?: string;
  claimedType?: string; // 声称的类型（扩展名）
  detectedType?: string; // 检测到的实际类型
}

export interface FileValidationResult {
  valid: boolean;
  errors: FileValidationError[];
}
