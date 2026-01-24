import { motion } from "framer-motion";
import type { IconType } from "react-icons";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { fadeInUp, scaleIn } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface LandingCardProps {
  icon: IconType;
  title: string;
  description: string;
  features?: string[];
  variant?: "feature" | "role";
  index?: number;
  className?: string;
}

// 统一使用 CSS 变量配色
const colors = {
  gradient:
    "from-[hsl(var(--landing-gradient-from))] to-[hsl(var(--landing-gradient-to))]",
  text: "text-[hsl(var(--landing-gradient-from))]",
  dot: "bg-[hsl(var(--landing-gradient-from))]",
};

export function LandingCard({
  icon: Icon,
  title,
  description,
  features,
  variant = "feature",
  index = 0,
  className,
}: LandingCardProps) {
  const isRole = variant === "role";

  return (
    <motion.div
      variants={isRole ? scaleIn : fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * (isRole ? 0.15 : 0.1) }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className={cn("group", className)}
    >
      <Card className="h-full relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm shadow-[var(--landing-card-shadow)] hover:shadow-[var(--landing-card-shadow-hover)] transition-shadow duration-300">
        <CardHeader className={isRole ? "pb-4" : "pb-2"}>
          {/* Icon container */}
          <motion.div
            className={cn(
              "flex items-center justify-center rounded-xl bg-gradient-to-br",
              colors.gradient,
              isRole ? "h-16 w-16 mb-4 shadow-lg" : "h-12 w-12 mb-3",
            )}
            whileHover={isRole ? { rotate: 12, scale: 1.1 } : { scale: 1.1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <Icon
              className={cn("text-white", isRole ? "h-8 w-8" : "h-6 w-6")}
            />
          </motion.div>

          <CardTitle
            className={cn("font-bold", isRole ? "text-xl" : "text-lg")}
          >
            {title}
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            {description}
          </CardDescription>
        </CardHeader>

        {features && features.length > 0 && (
          <CardContent className="pt-0">
            <ul className="space-y-2.5">
              {features.map((feature, i) => (
                <motion.li
                  key={i}
                  className="flex items-center gap-2.5 text-sm text-muted-foreground"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 + i * 0.05 + 0.3 }}
                >
                  <span
                    className={cn("h-2 w-2 rounded-full shrink-0", colors.dot)}
                  />
                  {feature}
                </motion.li>
              ))}
            </ul>
          </CardContent>
        )}

        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[hsl(var(--landing-gradient-from)/0)] to-[hsl(var(--landing-gradient-to)/0)] group-hover:from-[hsl(var(--landing-gradient-from)/0.02)] group-hover:to-[hsl(var(--landing-gradient-to)/0.02)] transition-all duration-300 pointer-events-none" />
      </Card>
    </motion.div>
  );
}
