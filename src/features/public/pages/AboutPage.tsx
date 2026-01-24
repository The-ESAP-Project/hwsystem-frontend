import { useTranslation } from "react-i18next";
import {
  FiBarChart2,
  FiCode,
  FiMoon,
  FiShield,
  FiSmartphone,
  FiUsers,
} from "react-icons/fi";
import { Link } from "react-router";

export function AboutPage() {
  const { t } = useTranslation();

  const features = [
    { key: "multiRole", icon: FiUsers },
    { key: "responsive", icon: FiSmartphone },
    { key: "modernTech", icon: FiCode },
    { key: "darkMode", icon: FiMoon },
    { key: "security", icon: FiShield },
    { key: "visualization", icon: FiBarChart2 },
  ];

  return (
    <div className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("about.title")}
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t("about.subtitle")}
          </p>
        </div>

        {/* Features */}
        <section className="mb-24">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
            {t("about.features.title")}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12">
            {t("about.features.description")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.key}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t(`about.features.items.${feature.key}.title`)}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {t(`about.features.items.${feature.key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Performance */}
        <section className="mb-24">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
            {t("about.performance.title")}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12">
            {t("about.performance.subtitle")}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {["responseTime", "concurrency", "memory", "startup"].map((key) => (
              <div
                key={key}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 text-center"
              >
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {t(`about.performance.${key}.value`)}
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                  {t(`about.performance.${key}.title`)}
                </p>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {t(`about.performance.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Back Home */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            {t("contact.backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
