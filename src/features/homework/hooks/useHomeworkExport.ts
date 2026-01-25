import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useApiError } from "@/hooks/useApiError";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { homeworkService } from "../services/homeworkService";

// 导出作业统计报表
export function useExportHomeworkStats() {
  const { t } = useTranslation();
  const success = useNotificationStore((s) => s.success);
  const { handleError } = useApiError();

  return useMutation({
    mutationFn: async ({
      homeworkId,
      homeworkTitle,
    }: {
      homeworkId: string;
      homeworkTitle?: string;
    }) => {
      const blob = await homeworkService.exportStats(homeworkId);
      // 触发下载
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const filename = homeworkTitle
        ? `${homeworkTitle}_stats.xlsx`
        : `homework_${homeworkId}_stats.xlsx`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      success(
        t("notify.homework.exportSuccess"),
        t("notify.homework.exported"),
      );
    },
    onError: (err) => {
      handleError(err, { title: t("notify.homework.exportFailed") });
    },
  });
}
