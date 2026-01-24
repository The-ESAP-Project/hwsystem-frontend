import { useTranslation } from "react-i18next";
import { FiAlertTriangle } from "react-icons/fi";
import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function RegisterPage() {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-md px-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center mb-4">
            <span className="text-white font-bold text-lg">HW</span>
          </div>
          <CardTitle className="text-2xl">{t("auth.register.title")}</CardTitle>
          <CardDescription>{t("auth.register.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex gap-3">
              <FiAlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {t("auth.register.notAvailable")}
                </h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  {t("auth.register.notAvailableMessage")}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.register.hasAccount")}{" "}
            <Link to="/auth/login" className="text-primary hover:underline">
              {t("auth.register.loginLink")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
