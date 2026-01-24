import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export function AppFooter() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { to: "/about", label: t("footer.about") },
    { to: "/contact", label: t("footer.contact") },
    { to: "/privacy", label: t("footer.privacy") },
    { to: "/terms", label: t("footer.terms") },
  ];

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("footer.copyright", { year: currentYear })}
          </p>
          <nav className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
