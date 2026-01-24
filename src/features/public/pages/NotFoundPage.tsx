import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiHome } from "react-icons/fi";
import { Link, useLocation } from "react-router";

export function NotFoundPage() {
  const { t } = useTranslation();
  const location = useLocation();

  const suggestions = [
    { to: "/", label: t("nav.home") },
    { to: "/about", label: t("nav.about") },
    { to: "/contact", label: t("nav.contact") },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center">
        <p className="text-9xl font-bold text-blue-600 dark:text-blue-400">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
          {t("error.notFound.title")}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md">
          {t("error.notFound.description")}
        </p>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
          {t("error.notFound.path")}:{" "}
          <code className="font-mono">{location.pathname}</code>
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <FiArrowLeft className="h-4 w-4" />
            {t("error.notFound.goBack")}
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <FiHome className="h-4 w-4" />
            {t("error.notFound.goHome")}
          </Link>
        </div>

        <div className="mt-12">
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
            {t("error.notFound.suggestions")}
          </p>
          <div className="flex items-center justify-center gap-4">
            {suggestions.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
