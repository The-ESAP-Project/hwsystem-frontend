import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FiBarChart2, FiBell, FiSmartphone } from "react-icons/fi";
import { staggerContainer } from "@/lib/motion";
import { LandingCard } from "./LandingCard";
import { Section } from "./Section";

const features = [
  { key: "responsive", icon: FiSmartphone },
  { key: "notification", icon: FiBell },
  { key: "visualization", icon: FiBarChart2 },
];

export function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <Section
      variant="default"
      titleKey="home.features.title"
      descriptionKey="home.features.description"
    >
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {features.map((feature, index) => (
          <LandingCard
            key={feature.key}
            icon={feature.icon}
            title={t(`home.features.items.${feature.key}.name`)}
            description={t(`home.features.items.${feature.key}.description`)}
            index={index}
          />
        ))}
      </motion.div>
    </Section>
  );
}
