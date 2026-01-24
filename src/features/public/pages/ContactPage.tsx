import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FiMail, FiMapPin, FiMessageCircle, FiPhone } from "react-icons/fi";
import { Link } from "react-router";
import { Section } from "@/components/landing/Section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fadeInUp, staggerContainer } from "@/lib/motion";

const contactInfo = [
  { key: "email", icon: FiMail, color: "blue" },
  { key: "phone", icon: FiPhone, color: "green" },
  { key: "address", icon: FiMapPin, color: "purple" },
  { key: "online", icon: FiMessageCircle, color: "orange" },
] as const;

const contactDetails: Record<string, string[]> = {
  email: ["support", "admin"],
  phone: ["number", "hours"],
  address: ["street", "building"],
  online: ["wechat", "qq"],
};

export function ContactPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Section
        variant="gradient"
        className="py-24"
        titleKey="contact.title"
        descriptionKey="contact.subtitle"
      >
        <div />
      </Section>

      {/* Contact Info */}
      <Section variant="muted" withDecoration>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {contactInfo.map((info) => {
            const Icon = info.icon;
            const details = contactDetails[info.key];

            return (
              <motion.div key={info.key} variants={fadeInUp}>
                <Card className="h-full shadow-[var(--landing-card-shadow)] hover:shadow-[var(--landing-card-shadow-hover)] transition-shadow duration-300">
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-4">
                      <motion.div
                        className={`h-12 w-12 rounded-xl bg-gradient-to-br from-${info.color}-500 to-${info.color}-600 flex items-center justify-center shadow-md`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </motion.div>
                      <CardTitle className="pt-2">
                        {t(`contact.info.${info.key}.title`)}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pl-20">
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {details.map((detail) => (
                        <p key={detail}>
                          {t(`contact.info.${info.key}.${detail}`)}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </Section>

      {/* CTA */}
      <Section variant="default" className="py-16">
        <div className="text-center">
          <Button asChild size="lg" className="px-8">
            <Link to="/">{t("contact.backHome")}</Link>
          </Button>
        </div>
      </Section>
    </div>
  );
}
