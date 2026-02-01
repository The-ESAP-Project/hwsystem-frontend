import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useApiError } from "@/hooks/useApiError";
import { downloadBlob } from "@/lib/download";
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
      const filename = homeworkTitle
        ? `${homeworkTitle}_stats.xlsx`
        : `homework_${homeworkId}_stats.xlsx`;
      downloadBlob(blob, filename);
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
