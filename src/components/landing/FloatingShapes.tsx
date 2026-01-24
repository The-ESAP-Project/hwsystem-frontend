import { motion } from "framer-motion";

const shapes = [
  { size: 60, x: "10%", y: "20%", duration: 6, delay: 0 },
  { size: 40, x: "80%", y: "30%", duration: 8, delay: 1 },
  { size: 80, x: "20%", y: "70%", duration: 7, delay: 0.5 },
  { size: 50, x: "70%", y: "60%", duration: 9, delay: 1.5 },
  { size: 35, x: "50%", y: "15%", duration: 5, delay: 2 },
  { size: 45, x: "90%", y: "80%", duration: 7, delay: 0.8 },
];

export function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {shapes.map((shape, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-white/10"
          style={{
            width: shape.size,
            height: shape.size,
            left: shape.x,
            top: shape.y,
          }}
          animate={{
            y: [-20, 20, -20],
            rotate: [0, 180, 360],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: shape.duration,
            repeat: Infinity,
            delay: shape.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
