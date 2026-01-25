import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 路由
          router: ["react-router"],
          // UI 组件库
          radix: [
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-avatar",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-label",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-progress",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
          ],
          // 动画
          motion: ["framer-motion"],
          // 图标
          icons: ["lucide-react", "react-icons"],
          // 数据获取 & 表单
          data: [
            "@tanstack/react-query",
            "react-hook-form",
            "@hookform/resolvers",
            "zod",
            "axios",
          ],
          // 国际化
          i18n: [
            "i18next",
            "i18next-browser-languagedetector",
            "react-i18next",
          ],
        },
      },
    },
  },
  server: {
    port: 5174, // 避免与 Vue 项目冲突
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://localhost:8080",
        ws: true,
      },
    },
  },
});
