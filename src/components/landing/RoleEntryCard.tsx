import { motion } from "framer-motion";
import { Link } from "react-router";
import type { IconType } from "react-icons";
import { cn } from "@/lib/utils";

interface RoleEntryCardProps {
  icon: IconType;
  title: string;
  description: string;
  to: string;
  index?: number;
}

export function RoleEntryCard({
  icon: Icon,
  title,
  description,
  to,
  index = 0,
}: RoleEntryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
    >
      <Link
        to={to}
        className={cn(
          "group flex flex-col items-center p-6 sm:p-8",
          "bg-white dark:bg-gray-800 rounded-2xl",
          "border-2 border-gray-100 dark:border-gray-700",
          "shadow-[var(--landing-card-shadow)]",
          "hover:shadow-[var(--landing-card-shadow-hover)]",
          "hover:border-[hsl(var(--landing-gradient-from))]",
          "transition-all duration-200"
        )}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--landing-gradient-from)/0.1)] text-[hsl(var(--landing-gradient-from))] mb-4 group-hover:bg-[hsl(var(--landing-gradient-from))] group-hover:text-white transition-colors duration-200">
          <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground text-center">{description}</p>
      </Link>
    </motion.div>
  );
}
