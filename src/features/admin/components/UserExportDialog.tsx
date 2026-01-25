import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiDownload } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useExportUsers } from "../hooks/useUsers";
import type { UserRole, UserStatus } from "../services/userService";

interface UserExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFilters: {
    role?: UserRole | "all";
    status?: UserStatus | "all";
    search?: string;
  };
}

export function UserExportDialog({
  open,
  onOpenChange,
  currentFilters,
}: UserExportDialogProps) {
  const { t } = useTranslation();
  const [format, setFormat] = useState<"csv" | "xlsx">("xlsx");
  const [scope, setScope] = useState<"all" | "filtered">("all");

  const exportMutation = useExportUsers();

  const hasFilters =
    (currentFilters.role && currentFilters.role !== "all") ||
    (currentFilters.status && currentFilters.status !== "all") ||
    (currentFilters.search && currentFilters.search.trim() !== "");

  const handleExport = () => {
    const params =
      scope === "filtered" && hasFilters
        ? {
            format,
            role:
              currentFilters.role && currentFilters.role !== "all"
                ? currentFilters.role
                : null,
            status:
              currentFilters.status && currentFilters.status !== "all"
                ? currentFilters.status
                : null,
            search: currentFilters.search?.trim() || null,
          }
        : { format, role: null, status: null, search: null };

    exportMutation.mutate(params, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const roleLabels: Record<UserRole, string> = {
    admin: t("role.admin"),
    teacher: t("role.teacher"),
    user: t("role.student"),
  };

  const statusLabels: Record<UserStatus, string> = {
    active: t("status.active"),
    suspended: t("status.suspended"),
    banned: t("status.banned"),
  };

  const getFilterSummary = () => {
    const parts: string[] = [];
    if (currentFilters.role && currentFilters.role !== "all") {
      parts.push(`${t("userForm.role")}: ${roleLabels[currentFilters.role]}`);
    }
    if (currentFilters.status && currentFilters.status !== "all") {
      parts.push(
        `${t("userForm.status")}: ${statusLabels[currentFilters.status]}`,
      );
    }
    if (currentFilters.search?.trim()) {
      parts.push(`${t("common.search")}: "${currentFilters.search.trim()}"`);
    }
    return parts.length > 0 ? parts.join(", ") : null;
  };

  const filterSummary = getFilterSummary();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.users.export.title", "导出用户")}</DialogTitle>
          <DialogDescription>
            {t(
              "admin.users.export.description",
              "选择导出格式和范围，下载用户数据",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 导出格式 */}
          <div className="space-y-3">
            <Label>{t("admin.users.export.format", "导出格式")}</Label>
            <RadioGroup
              value={format}
              onValueChange={(v) => setFormat(v as "csv" | "xlsx")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xlsx" id="format-xlsx" />
                <Label
                  htmlFor="format-xlsx"
                  className="font-normal cursor-pointer"
                >
                  Excel (.xlsx)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="format-csv" />
                <Label
                  htmlFor="format-csv"
                  className="font-normal cursor-pointer"
                >
                  CSV (.csv)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* 导出范围 */}
          <div className="space-y-3">
            <Label>{t("admin.users.export.scope", "导出范围")}</Label>
            <RadioGroup
              value={scope}
              onValueChange={(v) => setScope(v as "all" | "filtered")}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="scope-all" />
                <Label
                  htmlFor="scope-all"
                  className="font-normal cursor-pointer"
                >
                  {t("admin.users.export.scopeAll", "全部用户")}
                </Label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem
                  value="filtered"
                  id="scope-filtered"
                  disabled={!hasFilters}
                  className="mt-1"
                />
                <div>
                  <Label
                    htmlFor="scope-filtered"
                    className={`font-normal cursor-pointer ${!hasFilters ? "text-muted-foreground" : ""}`}
                  >
                    {t("admin.users.export.scopeFiltered", "按当前筛选条件")}
                  </Label>
                  {filterSummary ? (
                    <p className="text-sm text-muted-foreground mt-1">
                      {filterSummary}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("admin.users.export.noFilters", "当前未设置筛选条件")}
                    </p>
                  )}
                </div>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "取消")}
          </Button>
          <Button onClick={handleExport} disabled={exportMutation.isPending}>
            <FiDownload className="mr-2 h-4 w-4" />
            {exportMutation.isPending
              ? t("admin.users.export.exporting", "导出中...")
              : t("admin.users.export.export", "导出")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
