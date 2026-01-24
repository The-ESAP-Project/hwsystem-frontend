import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FiBook, FiUsers, FiClipboard } from "react-icons/fi";
import { useDashboardPath, useIsAuthenticated, useCurrentUser } from "@/stores/useUserStore";
import { RoleEntryCard } from "./RoleEntryCard";

export function HeroSection() {
  const { t } = useTranslation();
  const isAuthenticated = useIsAuthenticated();
  const dashboardPath = useDashboardPath();
  const user = useCurrentUser();

  const roleEntries = [
    {
      key: "student",
      icon: FiBook,
      title: t("home.roles.items.student.name"),
      description: t("home.hero.studentDesc"),
      to: isAuthenticated && user?.role === "user" ? dashboardPath : "/auth/login",
    },
    {
      key: "monitor",
      icon: FiUsers,
      title: t("home.roles.items.monitor.name"),
      description: t("home.hero.monitorDesc"),
      to: isAuthenticated ? dashboardPath : "/auth/login",
    },
    {
      key: "teacher",
      icon: FiClipboard,
      title: t("home.roles.items.teacher.name"),
      description: t("home.hero.teacherDesc"),
      to: isAuthenticated && user?.role === "teacher" ? dashboardPath : "/auth/login",
    },
  ];

  return (
    <section className="relative min-h-[85vh] flex items-center bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center">
          {/* Title with gradient text */}
          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-[hsl(var(--landing-gradient-from))] via-[hsl(var(--landing-gradient-via))] to-[hsl(var(--landing-gradient-to))] bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {t("home.hero.title")}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {t("home.hero.subtitle")}
          </motion.p>

          {/* Role Entry Cards */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {roleEntries.map((role, index) => (
              <RoleEntryCard
                key={role.key}
                icon={role.icon}
                title={role.title}
                description={role.description}
                to={role.to}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
