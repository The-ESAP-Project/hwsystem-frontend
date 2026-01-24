import { motion } from "framer-motion";
import { Link } from "react-router";

interface GlowButtonProps {
  to: string;
  children: React.ReactNode;
  variant?: "primary" | "outline";
}

export function GlowButton({
  to,
  children,
  variant = "primary",
}: GlowButtonProps) {
  const baseClasses =
    "relative inline-flex items-center px-7 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300";

  const variantClasses = {
    primary:
      "bg-white text-blue-600 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105",
    outline:
      "border-2 border-white/30 text-white hover:border-white/60 hover:bg-white/10 hover:scale-105",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.9 }}
    >
      <Link to={to} className={`${baseClasses} ${variantClasses[variant]}`}>
        {variant === "primary" && (
          <span className="absolute inset-0 rounded-xl bg-white/20 blur-md -z-10 opacity-0 hover:opacity-100 transition-opacity" />
        )}
        {children}
      </Link>
    </motion.div>
  );
}
