import { motion } from "framer-motion";
import type { IconType } from "react-icons";
import { fadeInUp } from "@/lib/motion";

interface FeatureCardProps {
  icon: IconType;
  name: string;
  description: string;
  index: number;
}

export function FeatureCard({
  icon: Icon,
  name,
  description,
  index,
}: FeatureCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="group relative bg-white dark:bg-gray-800/80 rounded-2xl p-6 shadow-sm border border-gray-200/80 dark:border-gray-700/50 hover:shadow-xl hover:shadow-blue-500/5 transition-shadow duration-300 backdrop-blur-sm"
    >
      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
        <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:animate-bounce" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {name}
      </h3>
      <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        {description}
      </p>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/[0.02] group-hover:to-purple-500/[0.02] transition-all duration-300" />
    </motion.div>
  );
}
