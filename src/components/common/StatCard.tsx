import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import { Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const variantStyles = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-600 dark:text-green-400",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-600 dark:text-orange-400",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-600 dark:text-purple-400",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
  },
};

interface StatCardProps {
  icon: IconType;
  labelKey: string;
  value: string | number;
  variant?: keyof typeof variantStyles;
  href?: string;
  className?: string;
}

export function StatCard({
  icon: Icon,
  labelKey,
  value,
  variant = "blue",
  href,
  className,
}: StatCardProps) {
  const { t } = useTranslation();
  const styles = variantStyles[variant];

  const content = (
    <Card
      className={cn(
        href && "hover:shadow-md transition-shadow cursor-pointer",
        className,
      )}
    >
      <CardContent className="flex items-center gap-4 p-6">
        <div className={cn("p-3 rounded-xl", styles.bg)}>
          <Icon className={cn("h-6 w-6", styles.text)} />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {t(labelKey)}
          </p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
}
