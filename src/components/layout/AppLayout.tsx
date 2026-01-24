import { Outlet } from "react-router";

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 flex items-center justify-center">
        <Outlet />
      </main>
    </div>
  );
}
