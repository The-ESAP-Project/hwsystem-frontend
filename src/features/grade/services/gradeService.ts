import api from "@/lib/api";
import type {
  CreateGradeRequest,
  GradeResponse,
  UpdateGradeRequest,
} from "@/types/generated";

// submission_id 从 URL 参数获取，不需要写入请求体
export type CreateGradeInput = Omit<CreateGradeRequest, "submission_id">;

// API 响应类型
export type GradeDetail = GradeResponse;

export const gradeService = {
  // 创建评分
  create: async (submissionId: string, req: CreateGradeInput) => {
    const { data } = await api.post<{ data: GradeDetail }>("/grades", {
      ...req,
      submission_id: submissionId,
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
