import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

interface DarkModeState {
  theme: Theme;
  isDark: boolean;
  init: () => void;
  setTheme: (theme: Theme) => void;
  toggleDarkMode: () => void;
}

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const applyTheme = (isDark: boolean) => {
  document.documentElement.classList.toggle("dark", isDark);
};

export const useDarkMode = create<DarkModeState>()(
  persist(
    (set, get) => ({
      theme: "system",
      isDark: false,

      init: () => {
        const { theme } = get();
        const isDark =
          theme === "dark" || (theme === "system" && getSystemTheme());
        applyTheme(isDark);
        set({ isDark });

        // 监听系统主题变化
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        mediaQuery.addEventListener("change", (e) => {
          if (get().theme === "system") {
            applyTheme(e.matches);
            set({ isDark: e.matches });
          }
        });
      },

      setTheme: (theme) => {
        const isDark =
          theme === "dark" || (theme === "system" && getSystemTheme());
        applyTheme(isDark);
        set({ theme, isDark });
      },

      toggleDarkMode: () => {
        const newTheme = get().isDark ? "light" : "dark";
        get().setTheme(newTheme);
      },
    }),
    {
      name: "theme-storage",
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
