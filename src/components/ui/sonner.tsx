"use client";

import {
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiLoader,
  FiXOctagon,
} from "react-icons/fi";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useDarkMode } from "@/hooks/useDarkMode";

const Toaster = ({ ...props }: ToasterProps) => {
  const isDark = useDarkMode((s) => s.isDark);

  return (
    <Sonner
      theme={isDark ? "dark" : "light"}
      className="toaster group"
      icons={{
        success: <FiCheckCircle className="size-4" />,
        info: <FiInfo className="size-4" />,
        warning: <FiAlertTriangle className="size-4" />,
        error: <FiXOctagon className="size-4" />,
        loading: <FiLoader className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "hsl(var(--popover))",
          "--normal-text": "hsl(var(--popover-foreground))",
          "--normal-border": "hsl(var(--border))",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
export type { ToasterProps };
