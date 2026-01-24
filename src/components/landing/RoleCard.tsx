import { motion } from "framer-motion";
import type { IconType } from "react-icons";
import { scaleIn } from "@/lib/motion";

interface RoleCardProps {
  icon: IconType;
  name: string;
  description: string;
  features: string[];
  color: string;
  index: number;
}

export function RoleCard({
  icon: Icon,
  name,
  description,
  features,
  color,
  index,
}: RoleCardProps) {
  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.15 }}
      className="group relative bg-white dark:bg-gray-800/80 rounded-2xl p-8 border border-gray-200/80 dark:border-gray-700/50 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300 backdrop-blur-sm"
    >
      {/* Decorative ring */}
      <div className="relative mb-6">
        <motion.div
          className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}
          whileHover={{ rotate: 12, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <Icon className="h-8 w-8 text-white" />
        </motion.div>
        {/* Ring decoration */}
        <div
          className={`absolute -inset-2 rounded-2xl bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 blur-md transition-opacity duration-300`}
        />
      </div>

      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
        {name}
      </h3>
      <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        {description}
      </p>

      <ul className="mt-5 space-y-2.5">
        {features.map((feature, i) => (
          <motion.li
            key={i}
            className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.15 + i * 0.05 + 0.3 }}
          >
            <span
              className={`h-2 w-2 rounded-full bg-gradient-to-r ${color} shrink-0`}
            />
            {feature}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
