import api from "@/lib/api";
import type { Stringify } from "@/types";
import type {
  CreateSubmissionRequest,
  GradeResponse,
  SubmissionListItem,
  SubmissionListResponse,
  SubmissionResponse,
  SubmissionSummaryItem,
  SubmissionSummaryResponse,
} from "@/types/generated";

// homework_id 从 URL 参数获取，不需要写入请求体
export type SubmissionCreateInput = Omit<
  Stringify<CreateSubmissionRequest>,
  "homework_id"
>;

// 前端友好的查询参数类型
export interface SubmissionSummaryQueryInput {
  page?: number;
  size?: number;
  graded?: boolean;
}

// API 响应类型 - 直接使用生成类型的 Stringify 版本
export type SubmissionDetail = Stringify<SubmissionResponse>;
export type SubmissionListItemStringified = Stringify<SubmissionListItem>;
export type SubmissionSummaryItemStringified = Stringify<SubmissionSummaryItem>;

// 扩展类型：用于需要 version/is_late/homework 字段的详情响应
// SubmissionResponse 本身不含这些字段，但 API 返回的完整提交详情包含
export type SubmissionDetailWithHistory = SubmissionDetail & {
  version: number;
  is_late: boolean;
  // 评分页面需要的作业信息
  homework?: {
    id: string;
    title: string;
    max_score: number;
    deadline?: string | null;
  };
};

export interface SubmissionListResponseStringified {
  items: SubmissionListItemStringified[];
  pagination?: Stringify<SubmissionListResponse>["pagination"];
}

export interface SubmissionSummaryResponseStringified {
  items: SubmissionSummaryItemStringified[];
  pagination?: Stringify<SubmissionSummaryResponse>["pagination"];
}

export const submissionService = {
  // 获取所有提交列表（教师视图）
  list: async (
    homeworkId: string,
    params?: {
      page?: number;
      size?: number;
      status?: string;
      latest_only?: boolean;
    },
  ) => {
    const { data } = await api.get<{ data: SubmissionListResponseStringified }>(
      "/submissions",
      {
        params: {
          homework_id: Number(homeworkId),
          page: params?.page,
          size: params?.size,
          status: params?.status,
          latest_only: params?.latest_only,
        },
      },
    );
    return data.data;
  },

  // 提交作业
  create: async (homeworkId: string, req: SubmissionCreateInput) => {
    const { data } = await api.post<{ data: SubmissionDetail }>(
      "/submissions",
      { ...req, homework_id: Number(homeworkId) },
    );
    return data.data;
  },

  // 获取我的提交历史
  getMy: async (homeworkId: string) => {
    const { data } = await api.get<{
      data: { items: SubmissionDetailWithHistory[] };
    }>(`/homeworks/${homeworkId}/submissions/my`);
    return data.data;
  },

  // 获取我的最新提交（包含 version 等扩展字段）
  getMyLatest: async (homeworkId: string) => {
    const { data } = await api.get<{ data: SubmissionDetailWithHistory }>(
      `/homeworks/${homeworkId}/submissions/my/latest`,
    );
    return data.data;
  },

  // 获取提交详情（包含作业信息，用于评分页面）
  get: async (submissionId: string) => {
    const { data } = await api.get<{ data: SubmissionDetailWithHistory }>(
      `/submissions/${submissionId}`,
    );
    return data.data;
  },

  // 撤回提交
  delete: async (submissionId: string) => {
    await api.delete(`/submissions/${submissionId}`);
  },

  // 获取提交概览（按学生聚合，教师视图）
  getSummary: async (
    homeworkId: string,
    params?: SubmissionSummaryQueryInput,
  ) => {
    const { data } = await api.get<{
      data: SubmissionSummaryResponseStringified;
    }>(`/homeworks/${homeworkId}/submissions/summary`, {
      params,
    });
    return data.data;
  },

  // 获取某学生某作业的所有提交版本（教师视图）
  getUserSubmissionsForTeacher: async (homeworkId: string, userId: string) => {
    const { data } = await api.get<{
      data: { items: SubmissionDetailWithHistory[] };
    }>(`/homeworks/${homeworkId}/submissions/user/${userId}`);
    return data.data;
  },

  // 获取提交的评分（学生查询自己的评分）
  getGrade: async (submissionId: string) => {
    const { data } = await api.get<{ data: Stringify<GradeResponse> }>(
      `/submissions/${submissionId}/grade`,
    );
    return data.data;
  },
};
