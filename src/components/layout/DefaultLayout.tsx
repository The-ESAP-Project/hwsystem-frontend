import { Outlet } from "react-router";
import { useAuthEventListener } from "@/hooks/useAuthEventListener";
import { AppFooter } from "./AppFooter";
import { AppHeader } from "./AppHeader";

export function DefaultLayout() {
  useAuthEventListener();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}
