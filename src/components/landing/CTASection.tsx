import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { fadeInUp } from "@/lib/motion";
import { useDashboardPath, useIsAuthenticated } from "@/stores/useUserStore";
import { FloatingShapes } from "./FloatingShapes";

export function CTASection() {
  const { t } = useTranslation();
  const isAuthenticated = useIsAuthenticated();
  const dashboardPath = useDashboardPath();

  return (
    <section className="relative py-28 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white overflow-hidden">
      <FloatingShapes />

      {/* Glow background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-[80px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {t("home.cta.title")}
        </motion.h2>
        <motion.p
          className="mt-4 text-lg text-blue-100/90 max-w-xl mx-auto"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          {t("home.cta.subtitle")}
        </motion.p>
        <motion.div
          className="mt-10"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          {isAuthenticated ? (
            <Link
              to={dashboardPath}
              className="inline-flex items-center px-8 py-4 rounded-xl bg-white text-blue-600 font-semibold hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 transition-all duration-300"
            >
              {t("home.cta.dashboard")}
            </Link>
          ) : (
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0px rgba(255,255,255,0)",
                  "0 0 30px rgba(255,255,255,0.2)",
                  "0 0 0px rgba(255,255,255,0)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block rounded-xl"
            >
              <Link
                to="/auth/login"
                className="inline-flex items-center px-8 py-4 rounded-xl bg-white text-blue-600 font-semibold hover:scale-105 transition-transform duration-300"
              >
                {t("home.cta.start")}
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
