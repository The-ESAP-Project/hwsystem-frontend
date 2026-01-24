import api from "@/lib/api";
import type { Stringify } from "@/types";
import type {
  CreateGradeRequest,
  Grade,
  Grader,
  UpdateGradeRequest,
} from "@/types/generated";

// submission_id 从 URL 参数获取，不需要写入请求体
export type CreateGradeInput = Omit<CreateGradeRequest, "submission_id">;

// 使用 generated type 的 Stringify 版本
export type GraderStringified = Stringify<Grader>;

// 扩展 Grade 类型，id 为 string
export interface GradeWithStringId extends Omit<Grade, "id" | "submission_id"> {
  id: string;
  submission_id: string;
  grader?: GraderStringified;
  max_score?: number;
}

export const gradeService = {
  // 获取评分
  get: async (submissionId: string) => {
    const { data } = await api.get<{ data: GradeWithStringId }>(
      `/submissions/${submissionId}/grade`,
    );
    return data.data;
  },

  // 创建评分
  create: async (submissionId: string, req: CreateGradeInput) => {
    const { data } = await api.post<{ data: GradeWithStringId }>("/grades", {
      ...req,
      submission_id: Number(submissionId),
    });
    return data.data;
  },

  // 修改评分
  update: async (gradeId: string, req: UpdateGradeRequest) => {
    const { data } = await api.put<{ data: GradeWithStringId }>(
      `/grades/${gradeId}`,
      req,
    );
    return data.data;
  },
};
