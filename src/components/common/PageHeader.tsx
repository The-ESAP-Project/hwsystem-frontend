import { useTranslation } from "react-i18next";
import { FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  titleKey: string;
  titleParams?: Record<string, string | number>;
  descriptionKey?: string;
  descriptionParams?: Record<string, string | number>;
  backLink?: string;
  backLabelKey?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  titleKey,
  titleParams,
  descriptionKey,
  descriptionParams,
  backLink,
  backLabelKey = "common.back",
  actions,
  className,
}: PageHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("mb-8", className)}>
      {backLink && (
        <Button variant="ghost" asChild className="mb-4 -ml-2">
          <Link to={backLink}>
            <FiArrowLeft className="mr-2 h-4 w-4" />
            {t(backLabelKey)}
          </Link>
        </Button>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t(titleKey, titleParams)}</h1>
          {descriptionKey && (
            <p className="mt-1 text-muted-foreground">
              {t(descriptionKey, descriptionParams)}
            </p>
          )}
        </div>
        {actions && <div className="flex gap-3">{actions}</div>}
      </div>
    </div>
  );
}
