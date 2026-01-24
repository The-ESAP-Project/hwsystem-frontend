import api from "@/lib/api";
import type { Stringify } from "@/types";
import type {
  Homework,
  HomeworkListResponse,
  HomeworkStatsResponse,
  ScoreRange,
  ScoreStats,
  UnsubmittedStudent,
  UpdateHomeworkRequest,
} from "@/types/generated";
import type { FileInfo } from "@/types/generated/file";

// 前端友好的输入类型（用于创建/更新）
export interface CreateHomeworkInput {
  title: string;
  description?: string | null;
  max_score?: number | null;
  deadline?: string | null;
  allow_late?: boolean | null;
  attachments?: string[] | null;
}

export type UpdateHomeworkInput = Partial<Stringify<UpdateHomeworkRequest>>;

// API 响应中的我的提交摘要
export interface HomeworkMySubmission {
  id: string;
  version: number;
  status: "pending" | "graded" | "late";
  score?: number;
}

// 附件信息类型（前端使用）
export type HomeworkAttachment = Stringify<FileInfo>;

// 作业详情响应类型（基于生成类型 + 扩展字段）
export interface HomeworkWithDetails extends Stringify<Homework> {
  attachments?: HomeworkAttachment[];
  attachment_count?: number;
  my_submission?: HomeworkMySubmission;
  allow_late_submission?: boolean;
}

// 作业列表响应类型
export interface HomeworkListResponseWithDetails {
  items: HomeworkWithDetails[];
  pagination?: Stringify<HomeworkListResponse>["pagination"];
}

// 作业统计响应类型（直接使用生成类型的 Stringify 版本）
export type HomeworkStats = Stringify<HomeworkStatsResponse>;

// 重导出子类型供页面使用
export type { ScoreStats, ScoreRange, UnsubmittedStudent };

export const homeworkService = {
  // 获取班级作业列表
  list: async (
    classId: string,
    params?: { page?: number; page_size?: number; status?: string },
  ) => {
    const { data } = await api.get<{ data: HomeworkListResponseWithDetails }>(
      "/homeworks",
      {
        params: {
          class_id: classId,
          page: params?.page,
          page_size: params?.page_size,
          status: params?.status,
        },
      },
    );
    return data.data;
  },

  // 获取作业详情
  get: async (homeworkId: string) => {
    const { data } = await api.get<{ data: HomeworkWithDetails }>(
      `/homeworks/${homeworkId}`,
    );
    return data.data;
  },

  // 创建作业
  create: async (classId: string, req: CreateHomeworkInput) => {
    const { data } = await api.post<{ data: HomeworkWithDetails }>(
      "/homeworks",
      { ...req, class_id: Number(classId) },
    );
    return data.data;
  },

  // 更新作业
  update: async (homeworkId: string, req: UpdateHomeworkInput) => {
    const { data } = await api.put<{ data: HomeworkWithDetails }>(
      `/homeworks/${homeworkId}`,
      req,
    );
    return data.data;
  },

  // 删除作业
  delete: async (homeworkId: string) => {
    await api.delete(`/homeworks/${homeworkId}`);
  },

  // 获取作业统计
  getStats: async (homeworkId: string) => {
    const { data } = await api.get<{ data: HomeworkStats }>(
      `/homeworks/${homeworkId}/stats`,
    );
    return data.data;
  },
};
