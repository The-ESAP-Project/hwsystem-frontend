import api from "@/lib/api";
import type { Stringify } from "@/types";
import type {
  CreateGradeRequest,
  GradeResponse,
  UpdateGradeRequest,
} from "@/types/generated";

// submission_id 从 URL 参数获取，不需要写入请求体
export type CreateGradeInput = Omit<CreateGradeRequest, "submission_id">;

// API 响应类型 - 直接使用生成类型的 Stringify 版本
export type GradeDetail = Stringify<GradeResponse>;

export const gradeService = {
  // 获取评分
  get: async (submissionId: string) => {
    const { data } = await api.get<{ data: GradeDetail }>(
      `/submissions/${submissionId}/grade`,
    );
    return data.data;
  },

  // 创建评分
  create: async (submissionId: string, req: CreateGradeInput) => {
    const { data } = await api.post<{ data: GradeDetail }>("/grades", {
      ...req,
      submission_id: Number(submissionId),
    });
    return data.data;
  },

  // 修改评分
  update: async (gradeId: string, req: UpdateGradeRequest) => {
    const { data } = await api.put<{ data: GradeDetail }>(
      `/grades/${gradeId}`,
      req,
    );
    return data.data;
  },
};
