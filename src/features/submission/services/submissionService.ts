import type {
  HomeworkAttachment,
  HomeworkWithDetails,
} from "@/features/homework/services/homeworkService";
import api from "@/lib/api";
import type { Stringify } from "@/types";
import type {
  CreateSubmissionRequest,
  Submission,
  SubmissionCreator,
  SubmissionGradeInfo,
  SubmissionListResponse,
} from "@/types/generated";

// homework_id 从 URL 参数获取，不需要写入请求体
export type SubmissionCreateInput = Omit<
  Stringify<CreateSubmissionRequest>,
  "homework_id"
>;

// 使用 generated types 的 Stringify 版本
export type SubmissionCreatorStringified = Stringify<SubmissionCreator>;
export type SubmissionGradeStringified = Stringify<SubmissionGradeInfo>;

export interface SubmissionWithDetails
  extends Omit<Submission, "id" | "homework_id" | "creator_id"> {
  id: string;
  homework_id: string;
  creator_id: string;
  creator?: SubmissionCreatorStringified;
  attachments?: HomeworkAttachment[];
  attachment_count?: number;
  grade?: SubmissionGradeStringified;
  // 评分页面额外数据
  homework?: HomeworkWithDetails;
}

export interface SubmissionListResponseWithDetails {
  items: SubmissionWithDetails[];
  pagination?: SubmissionListResponse["pagination"];
}

export const submissionService = {
  // 获取所有提交列表（教师视图）
  list: async (
    homeworkId: string,
    params?: {
      page?: number;
      page_size?: number;
      status?: string;
      latest_only?: boolean;
    },
  ) => {
    const { data } = await api.get<{ data: SubmissionListResponseWithDetails }>(
      "/submissions",
      {
        params: {
          homework_id: Number(homeworkId),
          page: params?.page,
          page_size: params?.page_size,
          status: params?.status,
          latest_only: params?.latest_only,
        },
      },
    );
    return data.data;
  },

  // 提交作业
  create: async (homeworkId: string, req: SubmissionCreateInput) => {
    const { data } = await api.post<{ data: SubmissionWithDetails }>(
      "/submissions",
      { ...req, homework_id: Number(homeworkId) },
    );
    return data.data;
  },

  // 获取我的提交历史
  getMy: async (homeworkId: string) => {
    const { data } = await api.get<{ data: SubmissionListResponseWithDetails }>(
      `/homeworks/${homeworkId}/submissions/my`,
    );
    return data.data;
  },

  // 获取我的最新提交
  getMyLatest: async (homeworkId: string) => {
    const { data } = await api.get<{ data: SubmissionWithDetails }>(
      `/homeworks/${homeworkId}/submissions/my/latest`,
    );
    return data.data;
  },

  // 获取提交详情
  get: async (submissionId: string) => {
    const { data } = await api.get<{ data: SubmissionWithDetails }>(
      `/submissions/${submissionId}`,
    );
    return data.data;
  },

  // 撤回提交
  delete: async (submissionId: string) => {
    await api.delete(`/submissions/${submissionId}`);
  },
};
