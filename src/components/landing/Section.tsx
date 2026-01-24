import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { fadeInUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface SectionProps {
  titleKey?: string;
  descriptionKey?: string;
  variant?: "default" | "gradient" | "muted";
  className?: string;
  children: React.ReactNode;
  withDecoration?: boolean;
}

export function Section({
  titleKey,
  descriptionKey,
  variant = "default",
  className,
  children,
  withDecoration = false,
}: SectionProps) {
  const { t } = useTranslation();

  const variantStyles = {
    default: "bg-background",
    gradient:
      "bg-gradient-to-br from-[hsl(var(--landing-gradient-from))] via-[hsl(var(--landing-gradient-via))] to-[hsl(var(--landing-gradient-to))]",
    muted: "bg-muted/50",
  };

  return (
    <section
      className={cn(
        "py-[var(--landing-section-py)] sm:py-[var(--landing-section-py-sm)] relative overflow-hidden",
        variantStyles[variant],
        className
      )}
    >
      {withDecoration && variant !== "gradient" && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[hsl(var(--landing-gradient-from)/0.05)] rounded-full blur-[100px] pointer-events-none" />
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {(titleKey || descriptionKey) && (
          <motion.div
            className="text-center mb-16"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {titleKey && (
              <h2
                className={cn(
                  "text-3xl sm:text-4xl font-bold",
                  variant === "gradient"
                    ? "text-white"
                    : "text-foreground"
                )}
              >
                {t(titleKey)}
              </h2>
            )}
            {descriptionKey && (
              <p
                className={cn(
                  "mt-4 text-lg max-w-2xl mx-auto",
                  variant === "gradient"
                    ? "text-white/80"
                    : "text-muted-foreground"
                )}
              >
                {t(descriptionKey)}
              </p>
            )}
          </motion.div>
        )}

        {children}
      </div>
    </section>
  );
}
