import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FiBarChart2,
  FiBell,
  FiShield,
  FiSmartphone,
  FiStar,
  FiZap,
} from "react-icons/fi";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { FeatureCard } from "./FeatureCard";

const features = [
  { key: "responsive", icon: FiSmartphone },
  { key: "notification", icon: FiBell },
  { key: "visualization", icon: FiBarChart2 },
  { key: "grading", icon: FiStar },
  { key: "security", icon: FiShield },
  { key: "performance", icon: FiZap },
];

export function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section className="py-28 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          className="text-center mb-16"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            {t("home.features.title")}
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t("home.features.description")}
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.key}
              icon={feature.icon}
              name={t(`home.features.items.${feature.key}.name`)}
              description={t(`home.features.items.${feature.key}.description`)}
              index={index}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
