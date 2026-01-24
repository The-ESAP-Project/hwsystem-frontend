import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FiBell, FiGlobe, FiLogOut, FiMoon, FiMonitor, FiSun } from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useUnreadCount } from "@/features/notification/hooks/useNotification";
import {
  useCurrentUser,
  useRoleText,
  useUserAvatar,
  useUserAvatarColor,
  useUserStore,
} from "@/stores/useUserStore";

interface BreadcrumbConfig {
  path: string;
  labelKey: string;
}

// 路由到面包屑的映射
const breadcrumbMap: Record<string, string> = {
  // User routes
  "/user": "sidebar.user",
  "/user/dashboard": "sidebar.dashboard",
  "/user/classes": "sidebar.myClasses",
  "/user/submissions": "sidebar.mySubmissions",
  // Teacher routes
  "/teacher": "sidebar.teacher",
  "/teacher/dashboard": "sidebar.dashboard",
  "/teacher/classes": "sidebar.classManagement",
  "/teacher/students": "sidebar.studentManagement",
  // Admin routes
  "/admin": "sidebar.admin",
  "/admin/dashboard": "sidebar.dashboard",
  "/admin/users": "sidebar.userManagement",
  "/admin/classes": "sidebar.classManagement",
  "/admin/settings": "sidebar.systemSettings",
  // Common routes
  "/notifications": "common.notifications",
  "/settings": "sidebar.settings",
};

function generateBreadcrumbs(pathname: string): BreadcrumbConfig[] {
  const parts = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbConfig[] = [];

  let currentPath = "";
  for (const part of parts) {
    currentPath += `/${part}`;
    const labelKey = breadcrumbMap[currentPath];
    if (labelKey) {
      breadcrumbs.push({ path: currentPath, labelKey });
    }
  }

  return breadcrumbs;
}

export function DashboardHeader() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const currentUser = useCurrentUser();
  const logout = useUserStore((s) => s.logout);
  const avatar = useUserAvatar();
  const avatarColor = useUserAvatarColor();
  const roleText = useRoleText();

  const { theme, setTheme, isDark } = useDarkMode();
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.unread_count ?? 0;

  const breadcrumbs = useMemo(
    () => generateBreadcrumbs(location.pathname),
    [location.pathname]
  );

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "zh" ? "en" : "zh";
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="lg:hidden" />

        {breadcrumbs.length > 0 && (
          <Breadcrumb className="hidden sm:flex">
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <BreadcrumbItem key={crumb.path}>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{t(crumb.labelKey)}</BreadcrumbPage>
                  ) : (
                    <>
                      <BreadcrumbLink asChild>
                        <Link to={crumb.path}>{t(crumb.labelKey)}</Link>
                      </BreadcrumbLink>
                      <BreadcrumbSeparator />
                    </>
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Language Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLanguage}
          title={t("header.language")}
        >
          <FiGlobe className="h-5 w-5" />
        </Button>

        {/* Theme Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              {isDark ? (
                <FiMoon className="h-5 w-5" />
              ) : (
                <FiSun className="h-5 w-5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setTheme("light")}
              className={theme === "light" ? "bg-accent" : ""}
            >
              <FiSun className="mr-2 h-4 w-4" />
              {t("header.theme.light")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("dark")}
              className={theme === "dark" ? "bg-accent" : ""}
            >
              <FiMoon className="mr-2 h-4 w-4" />
              {t("header.theme.dark")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("system")}
              className={theme === "system" ? "bg-accent" : ""}
            >
              <FiMonitor className="mr-2 h-4 w-4" />
              {t("header.theme.system")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="icon" asChild>
          <Link to="/notifications" className="relative">
            <FiBell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
              <Avatar className={avatarColor}>
                <AvatarFallback className="text-white font-medium">
                  {avatar}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <p className="font-medium">
                {currentUser?.display_name || currentUser?.username}
              </p>
              <p className="text-xs text-muted-foreground">{roleText}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <FiLogOut className="mr-2 h-4 w-4" />
              {t("header.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
