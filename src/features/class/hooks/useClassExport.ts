import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useApiError } from "@/hooks/useApiError";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { classService } from "../services/classService";

// 导出班级报表
export function useExportClassReport() {
  const { t } = useTranslation();
  const success = useNotificationStore((s) => s.success);
  const { handleError } = useApiError();

  return useMutation({
    mutationFn: (classId: string) => classService.exportClassReport(classId),
    onSuccess: () => {
      success(t("notify.class.exportSuccess"), t("notify.class.exported"));
    },
    onError: (err) => {
      handleError(err, { title: t("notify.class.exportFailed") });
    },
  });
}
