import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FiBook, FiBookOpen, FiUsers } from "react-icons/fi";
import { fadeInUp } from "@/lib/motion";
import { RoleCard } from "./RoleCard";

const roles = [
  { key: "student", icon: FiBook, color: "from-green-500 to-emerald-500" },
  { key: "monitor", icon: FiUsers, color: "from-blue-500 to-indigo-500" },
  { key: "teacher", icon: FiBookOpen, color: "from-purple-500 to-pink-500" },
];

export function RolesSection() {
  const { t } = useTranslation();

  return (
    <section
      id="roles"
      className="py-28 bg-white dark:bg-gray-800 relative overflow-hidden"
    >
      {/* Background decorations */}
      <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[80px]" />
      <div className="absolute bottom-20 left-0 w-[300px] h-[300px] bg-green-500/5 rounded-full blur-[80px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          className="text-center mb-16"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            {t("home.roles.title")}
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t("home.roles.description")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roles.map((role, index) => (
            <RoleCard
              key={role.key}
              icon={role.icon}
              name={t(`home.roles.items.${role.key}.name`)}
              description={t(`home.roles.items.${role.key}.description`)}
              features={
                t(`home.roles.items.${role.key}.features`, {
                  returnObjects: true,
                }) as string[]
              }
              color={role.color}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
