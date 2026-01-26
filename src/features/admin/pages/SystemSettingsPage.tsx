import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiCheck,
  FiClock,
  FiDatabase,
  FiEdit2,
  FiFile,
  FiServer,
  FiSettings,
  FiX,
} from "react-icons/fi";
import { toast } from "sonner";
import { PageHeader } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAdminSettings,
  useSettingAudits,
  useSystemSettings,
  useUpdateSetting,
} from "../hooks/useSystemSettings";

// 格式化文件大小
function formatFileSize(bytes: string | number): string {
  const size = typeof bytes === "string" ? Number.parseInt(bytes, 10) : bytes;
  if (Number.isNaN(size)) return "N/A";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  let value = size;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(value % 1 === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

// 格式化日期时间
function formatDateTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

// 设置项显示名称映射
const settingLabels: Record<string, string> = {
  "app.system_name": "系统名称",
  "jwt.access_token_expiry": "Access Token 有效期（分钟）",
  "jwt.refresh_token_expiry": "Refresh Token 有效期（天）",
  "jwt.refresh_token_remember_me_expiry": "记住我有效期（天）",
  "upload.max_size": "文件大小限制（字节）",
  "upload.allowed_types": "允许的文件类型",
  "cors.allowed_origins": "允许的跨域来源",
  "cors.max_age": "预检请求缓存时间（秒）",
};

// 可编辑设置项组件
function EditableSetting({
  settingKey,
  value,
  valueType,
  onSave,
  isSaving,
}: {
  settingKey: string;
  value: string;
  valueType: string;
  onSave: (newValue: string) => void;
  isSaving: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const displayValue = () => {
    if (valueType === "json_array") {
      try {
        const arr = JSON.parse(value);
        return Array.isArray(arr) ? arr.join(", ") : value;
      } catch {
        return value;
      }
    }
    if (settingKey === "upload.max_size") {
      return formatFileSize(value);
    }
    return value;
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        {valueType === "json_array" ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 min-h-[80px] px-3 py-2 text-sm border rounded-md bg-background"
            disabled={isSaving}
          />
        ) : (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1"
            disabled={isSaving}
          />
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={handleSave}
          disabled={isSaving}
        >
          <FiCheck className="h-4 w-4 text-green-600" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <FiX className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-medium flex-1 break-all">{displayValue()}</span>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <FiEdit2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function SystemSettingsPage() {
  const { t } = useTranslation();
  const { data: settings, isLoading, isError } = useSystemSettings();
  const { data: adminSettings, isLoading: isAdminLoading } = useAdminSettings();
  const { data: audits, isLoading: isAuditsLoading } = useSettingAudits({
    size: 20,
  });
  const updateSetting = useUpdateSetting();

  const handleUpdateSetting = (key: string, value: string) => {
    updateSetting.mutate(
      { key, request: { value } },
      {
        onSuccess: () => {
          toast.success("配置已更新");
        },
        onError: (error) => {
          toast.error(`更新失败: ${error.message}`);
        },
      },
    );
  };

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader
          titleKey="systemSettings.title"
          descriptionKey="systemSettings.subtitle"
        />
        <Card>
          <CardContent className="p-12 text-center">
            <FiSettings className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">{t("common.loadError")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        titleKey="systemSettings.title"
        descriptionKey="systemSettings.subtitle"
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="settings">配置管理</TabsTrigger>
          <TabsTrigger value="audit">审计日志</TabsTrigger>
        </TabsList>

        {/* 概览标签页 */}
        <TabsContent value="overview" className="space-y-6">
          {/* 基础信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FiServer className="h-5 w-5" />
                {t("systemSettings.basicInfo.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              ) : (
                <dl className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <dt className="text-muted-foreground">
                      {t("systemSettings.basicInfo.systemName")}
                    </dt>
                    <dd className="font-medium">{settings?.system_name}</dd>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <dt className="text-muted-foreground">
                      {t("systemSettings.basicInfo.environment")}
                    </dt>
                    <dd>
                      <Badge
                        variant={
                          settings?.environment === "production"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {settings?.environment}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <dt className="text-muted-foreground">
                      {t("systemSettings.basicInfo.logLevel")}
                    </dt>
                    <dd>
                      <Badge variant="outline">{settings?.log_level}</Badge>
                    </dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>

          {/* 文件上传配置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FiFile className="h-5 w-5" />
                {t("systemSettings.fileUpload.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-40 mb-2" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              ) : (
                <dl className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <dt className="text-muted-foreground">
                      {t("systemSettings.fileUpload.maxFileSize")}
                    </dt>
                    <dd className="font-medium text-primary">
                      {formatFileSize(settings?.max_file_size || "0")}
                    </dd>
                  </div>
                  <div className="py-2">
                    <dt className="text-muted-foreground mb-3">
                      {t("systemSettings.fileUpload.allowedTypes")}
                    </dt>
                    <dd className="flex flex-wrap gap-2">
                      {settings?.allowed_file_types?.map((type) => (
                        <Badge
                          key={type}
                          variant="secondary"
                          className="font-mono text-xs"
                        >
                          {type}
                        </Badge>
                      ))}
                    </dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>

          {/* 存储信息提示 */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <FiDatabase className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p>{t("systemSettings.note")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 配置管理标签页 */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FiSettings className="h-5 w-5" />
                动态配置
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isAdminLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  ))}
                </div>
              ) : (
                <dl className="space-y-4">
                  {adminSettings?.settings.map((setting) => (
                    <div
                      key={setting.key}
                      className="group flex justify-between items-start py-3 border-b border-border/50 last:border-0"
                    >
                      <div className="flex-shrink-0 mr-4">
                        <dt className="text-sm font-medium">
                          {settingLabels[setting.key] || setting.key}
                        </dt>
                        <dd className="text-xs text-muted-foreground mt-1">
                          {setting.description}
                        </dd>
                      </div>
                      <div className="flex-1 max-w-md">
                        <EditableSetting
                          settingKey={setting.key}
                          value={setting.value}
                          valueType={setting.value_type}
                          onSave={(newValue) =>
                            handleUpdateSetting(setting.key, newValue)
                          }
                          isSaving={updateSetting.isPending}
                        />
                      </div>
                    </div>
                  ))}
                </dl>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 审计日志标签页 */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FiClock className="h-5 w-5" />
                配置变更记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isAuditsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <Skeleton className="h-4 w-48 mb-2" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))}
                </div>
              ) : audits?.audits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无配置变更记录
                </div>
              ) : (
                <div className="space-y-3">
                  {audits?.audits.map((audit) => (
                    <div
                      key={String(audit.id)}
                      className="p-4 border rounded-lg bg-muted/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {settingLabels[audit.setting_key] ||
                            audit.setting_key}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(audit.changed_at)}
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        {audit.old_value && (
                          <div className="text-muted-foreground">
                            <span className="text-red-500">-</span>{" "}
                            <code className="text-xs bg-muted px-1 rounded">
                              {audit.old_value.length > 50
                                ? `${audit.old_value.slice(0, 50)}...`
                                : audit.old_value}
                            </code>
                          </div>
                        )}
                        <div>
                          <span className="text-green-500">+</span>{" "}
                          <code className="text-xs bg-muted px-1 rounded">
                            {audit.new_value.length > 50
                              ? `${audit.new_value.slice(0, 50)}...`
                              : audit.new_value}
                          </code>
                        </div>
                      </div>
                      {audit.ip_address && (
                        <div className="text-xs text-muted-foreground mt-2">
                          IP: {audit.ip_address}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SystemSettingsPage;
