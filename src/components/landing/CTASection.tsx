import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { fadeInUp } from "@/lib/motion";
import { useDashboardPath, useIsAuthenticated } from "@/stores/useUserStore";
import { GlowButton } from "./GlowButton";

export function CTASection() {
  const { t } = useTranslation();
  const isAuthenticated = useIsAuthenticated();
  const dashboardPath = useDashboardPath();

  return (
    <section className="py-20 bg-[hsl(var(--landing-gradient-from)/0.05)] dark:bg-gray-800/50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.h2
            className="text-3xl sm:text-4xl font-bold text-foreground"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {t("home.cta.title")}
          </motion.h2>
          <motion.p
            className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {t("home.cta.subtitle")}
          </motion.p>
          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {isAuthenticated ? (
              <GlowButton to={dashboardPath} variant="primary" delay={0}>
                {t("home.cta.dashboard")}
              </GlowButton>
            ) : (
              <>
                <GlowButton to="/auth/login" variant="primary" delay={0}>
                  {t("home.cta.studentLogin")}
                </GlowButton>
                <GlowButton to="/auth/login" variant="outline" delay={0.1}>
                  {t("home.cta.teacherLogin")}
                </GlowButton>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
