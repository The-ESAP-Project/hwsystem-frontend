// 重导出所有 ts-rs 生成的类型
export * from "./generated";

// React 特有的类型扩展
export type Theme = "light" | "dark" | "system";

/**
 * 类型工具：把生成类型中的 bigint 递归转换为 string
 * 用于 API 响应类型，因为 JSON 序列化后 ID 字段实际上是 number/string
 *
 * 注意：联合类型会自动分发，所以 `bigint | null` 会正确变成 `string | null`
 */
export type Stringify<T> = T extends bigint
  ? string
  : T extends null
    ? null
    : T extends undefined
      ? undefined
      : T extends Array<infer U>
        ? Array<Stringify<U>>
        : T extends object
          ? { [K in keyof T]: Stringify<T[K]> }
          : T;
