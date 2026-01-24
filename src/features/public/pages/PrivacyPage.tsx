import { useTranslation } from "react-i18next";
import { FiAlertTriangle, FiShield } from "react-icons/fi";
import { Link } from "react-router";

export function PrivacyPage() {
  const { t } = useTranslation();

  const sections = [
    "collection",
    "usage",
    "sharing",
    "security",
    "rights",
    "cookies",
    "updates",
    "contact",
  ];

  return (
    <div className="py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
            <FiShield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("privacy.title")}
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {t("privacy.subtitle")}
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            {t("privacy.lastUpdated")}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section) => (
            <div
              key={section}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t(`privacy.sections.${section}.title`)}
              </h2>
              {section === "cookies" || section === "updates" ? (
                <p className="text-gray-600 dark:text-gray-400">
                  {t(`privacy.sections.${section}.content`)}
                </p>
              ) : (
                <>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {t(`privacy.sections.${section}.intro`)}
                  </p>
                  <ul className="space-y-2">
                    {(
                      t(`privacy.sections.${section}.items`, {
                        returnObjects: true,
                      }) as string[]
                    ).map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Notice */}
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <div className="flex gap-3">
            <FiAlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                {t("privacy.notice.title")}
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                {t("privacy.notice.content")}
              </p>
            </div>
          </div>
        </div>

        {/* Back Home */}
        <div className="mt-12 text-center">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            {t("privacy.backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
