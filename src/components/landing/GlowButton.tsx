import { motion } from "framer-motion";
import { Link } from "react-router";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GlowButtonProps {
  to?: string;
  children: React.ReactNode;
  variant?: "primary" | "outline" | "white";
  onClick?: () => void;
  className?: string;
  delay?: number;
  size?: "default" | "lg";
}

export function GlowButton({
  to,
  children,
  variant = "primary",
  onClick,
  className,
  delay = 0.2,
  size = "lg",
}: GlowButtonProps) {
  const cleverStyles = {
    primary: cn(
      buttonVariants({ variant: "default", size }),
      "bg-[hsl(var(--landing-gradient-from))] text-white",
      "hover:bg-[hsl(var(--landing-gradient-via))]",
      "rounded-full px-8 py-3 h-auto font-semibold",
      "shadow-md hover:shadow-lg",
      "transition-all duration-200",
    ),
    outline: cn(
      buttonVariants({ variant: "outline", size }),
      "border-2 border-[hsl(var(--landing-gradient-from))] text-[hsl(var(--landing-gradient-from))]",
      "bg-transparent hover:bg-[hsl(var(--landing-gradient-from)/0.05)]",
      "rounded-full px-8 py-3 h-auto font-semibold",
      "transition-all duration-200",
    ),
    white: cn(
      buttonVariants({ variant: "default", size }),
      "bg-white text-[hsl(var(--landing-gradient-from))]",
      "hover:bg-gray-50",
      "rounded-full px-8 py-3 h-auto font-semibold",
      "shadow-md hover:shadow-lg",
      "transition-all duration-200",
    ),
  };

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      {to ? (
        <Link to={to} className={cn(cleverStyles[variant], className)}>
          {children}
        </Link>
      ) : (
        <Button
          onClick={onClick}
          className={cn(cleverStyles[variant], className)}
        >
          {children}
        </Button>
      )}
    </motion.div>
  );

  return content;
}
