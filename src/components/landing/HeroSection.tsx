import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FiStar } from "react-icons/fi";
import { useDashboardPath, useIsAuthenticated } from "@/stores/useUserStore";
import { AnimatedTitle } from "./AnimatedTitle";
import { GlowButton } from "./GlowButton";
import { HeroBackground } from "./HeroBackground";

export function HeroSection() {
  const { t } = useTranslation();
  const isAuthenticated = useIsAuthenticated();
  const dashboardPath = useDashboardPath();

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
      <HeroBackground />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 relative z-10 w-full">
        <div className="text-center">
          {/* Badge */}
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-8 border border-white/20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <FiStar className="h-4 w-4" />
            {t("home.hero.badge")}
          </motion.span>

          {/* Title */}
          <AnimatedTitle
            text={t("home.hero.title")}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-tight"
          />

          {/* Subtitle */}
          <motion.p
            className="mt-6 text-lg sm:text-xl text-blue-100/90 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            {t("home.hero.subtitle")}
          </motion.p>

          {/* Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <GlowButton to={dashboardPath} variant="primary">
                {t("home.hero.dashboard")}
              </GlowButton>
            ) : (
              <GlowButton to="/auth/login" variant="primary">
                {t("home.hero.login")}
              </GlowButton>
            )}
            <GlowButton to="#roles" variant="outline">
              {t("home.hero.learnRoles")}
            </GlowButton>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 dark:from-gray-900 to-transparent" />
    </section>
  );
}
