import { useTranslation } from "react-i18next";
import { FiMail, FiMapPin, FiMessageCircle, FiPhone } from "react-icons/fi";
import { Link } from "react-router";

export function ContactPage() {
  const { t } = useTranslation();

  const contactInfo = [
    { key: "email", icon: FiMail },
    { key: "phone", icon: FiPhone },
    { key: "address", icon: FiMapPin },
    { key: "online", icon: FiMessageCircle },
  ];

  return (
    <div className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("contact.title")}
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            {t("contact.subtitle")}
          </p>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {contactInfo.map((info) => (
            <div
              key={info.key}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <info.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {t(`contact.info.${info.key}.title`)}
                  </h3>
                  {info.key === "email" && (
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>{t("contact.info.email.support")}</p>
                      <p>{t("contact.info.email.admin")}</p>
                    </div>
                  )}
                  {info.key === "phone" && (
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>{t("contact.info.phone.number")}</p>
                      <p>{t("contact.info.phone.hours")}</p>
                    </div>
                  )}
                  {info.key === "address" && (
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>{t("contact.info.address.street")}</p>
                      <p>{t("contact.info.address.building")}</p>
                    </div>
                  )}
                  {info.key === "online" && (
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>{t("contact.info.online.wechat")}</p>
                      <p>{t("contact.info.online.qq")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

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
