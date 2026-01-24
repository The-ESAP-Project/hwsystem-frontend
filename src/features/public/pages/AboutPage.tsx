import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FiBarChart2,
  FiCode,
  FiMoon,
  FiShield,
  FiSmartphone,
  FiUsers,
} from "react-icons/fi";
import { Link } from "react-router";
import { Section } from "@/components/landing/Section";
import { LandingCard } from "@/components/landing/LandingCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { staggerContainer, fadeInUp } from "@/lib/motion";

const features = [
  { key: "multiRole", icon: FiUsers },
  { key: "responsive", icon: FiSmartphone },
  { key: "modernTech", icon: FiCode },
  { key: "darkMode", icon: FiMoon },
  { key: "security", icon: FiShield },
  { key: "visualization", icon: FiBarChart2 },
];

const performanceMetrics = ["responseTime", "concurrency", "memory", "startup"];

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Section
        variant="gradient"
        className="py-24"
        titleKey="about.title"
        descriptionKey="about.subtitle"
      >
        <div />
      </Section>

      {/* Features Section */}
      <Section
        variant="muted"
        titleKey="about.features.title"
        descriptionKey="about.features.description"
        withDecoration
      >
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <LandingCard
              key={feature.key}
              icon={feature.icon}
              title={t(`about.features.items.${feature.key}.title`)}
              description={t(`about.features.items.${feature.key}.description`)}
              index={index}
            />
          ))}
        </motion.div>
      </Section>

      {/* Performance Section */}
      <Section
        variant="default"
        titleKey="about.performance.title"
        descriptionKey="about.performance.subtitle"
      >
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {performanceMetrics.map((key) => (
            <motion.div key={key} variants={fadeInUp}>
              <Card className="bg-gradient-to-br from-[hsl(var(--landing-gradient-from)/0.05)] to-[hsl(var(--landing-gradient-to)/0.05)] border-0 text-center">
                <CardContent className="pt-6">
                  <p className="text-3xl font-bold text-[hsl(var(--landing-gradient-from))]">
                    {t(`about.performance.${key}.value`)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {t(`about.performance.${key}.title`)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(`about.performance.${key}.description`)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* CTA */}
      <Section variant="muted" className="py-16">
        <div className="text-center">
          <Button asChild size="lg" className="px-8">
            <Link to="/">{t("contact.backHome")}</Link>
          </Button>
        </div>
      </Section>
    </div>
  );
}
