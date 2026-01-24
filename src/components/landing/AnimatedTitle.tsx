import { motion } from "framer-motion";

interface AnimatedTitleProps {
  text: string;
  className?: string;
}

export function AnimatedTitle({ text, className = "" }: AnimatedTitleProps) {
  return (
    <motion.h1
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
    >
      {text}
    </motion.h1>
  );
}
