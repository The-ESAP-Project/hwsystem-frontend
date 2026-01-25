import { useTranslation } from "react-i18next";
import { FiDatabase, FiFile, FiServer, FiSettings } from "react-icons/fi";
import { PageHeader } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSystemSettings } from "../hooks/useSystemSettings";

// 格式化文件大小
function formatFileSize(bytes: string | number): string {
  const size = typeof bytes === "string" ? parseInt(bytes, 10) : bytes;
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

export function SystemSettingsPage() {
  const { t } = useTranslation();
  const { data: settings, isLoading, isError } = useSystemSettings();

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

      <div className="grid gap-6">
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
      </div>
    </div>
  );
}

export default SystemSettingsPage;
