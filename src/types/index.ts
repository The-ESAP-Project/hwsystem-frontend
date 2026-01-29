// 重导出所有 ts-rs 生成的类型
export * from "./generated";

// React 特有的类型扩展
export type Theme = "light" | "dark" | "system";
