import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FiBook, FiBookOpen, FiUsers } from "react-icons/fi";
import { staggerContainer } from "@/lib/motion";
import { LandingCard } from "./LandingCard";
import { Section } from "./Section";

const roles = [
  { key: "student", icon: FiBook },
  { key: "monitor", icon: FiUsers },
  { key: "teacher", icon: FiBookOpen },
];

export function RolesSection() {
  const { t } = useTranslation();

  return (
    <Section
      variant="default"
      titleKey="home.roles.title"
      descriptionKey="home.roles.description"
      withDecoration
      className="scroll-mt-20"
    >
      <div id="roles" className="absolute -top-20" />
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {roles.map((role, index) => (
          <LandingCard
            key={role.key}
            icon={role.icon}
            title={t(`home.roles.items.${role.key}.name`)}
            description={t(`home.roles.items.${role.key}.description`)}
            features={
              t(`home.roles.items.${role.key}.features`, {
                returnObjects: true,
              }) as string[]
            }
            variant="role"
            index={index}
          />
        ))}
      </motion.div>
    </Section>
  );
}
