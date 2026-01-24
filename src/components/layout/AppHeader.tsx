import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiGlobe,
  FiGrid,
  FiLogOut,
  FiMenu,
  FiMonitor,
  FiMoon,
  FiSun,
  FiUser,
  FiX,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useDarkMode } from "@/hooks/useDarkMode";
import {
  useDashboardPath,
  useIsAuthenticated,
  useRoleText,
  useUserAvatar,
  useUserAvatarColor,
  useUserStore,
} from "@/stores/useUserStore";

export function AppHeader() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = useIsAuthenticated();
  const currentUser = useUserStore((s) => s.currentUser);
  const logout = useUserStore((s) => s.logout);
  const dashboardPath = useDashboardPath();
  const roleText = useRoleText();
  const avatar = useUserAvatar();
  const avatarColor = useUserAvatarColor();

  const { theme, setTheme, isDark } = useDarkMode();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "zh" ? "en" : "zh";
    i18n.changeLanguage(newLang);
  };

  const navLinks = [
    { to: "/", label: t("nav.home") },
    { to: "/about", label: t("nav.about") },
    { to: "/contact", label: t("nav.contact") },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">HW</span>
              </div>
              <span className="hidden sm:block font-semibold">
                {t("app.name")}
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
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

            {/* Auth */}
            {isAuthenticated ? (
              <>
                {/* 前往控制台按钮 */}
                <Button
                  asChild
                  variant="outline"
                  className="hidden sm:inline-flex"
                >
                  <Link to={dashboardPath}>
                    <FiGrid className="mr-2 h-4 w-4" />
                    {t("header.dashboard")}
                  </Link>
                </Button>

                {/* 用户菜单 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full p-0"
                    >
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
                      <p className="text-xs text-muted-foreground">
                        {roleText}
                      </p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="sm:hidden">
                      <Link to={dashboardPath} className="cursor-pointer">
                        <FiGrid className="mr-2 h-4 w-4" />
                        {t("header.dashboard")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <FiLogOut className="mr-2 h-4 w-4" />
                      {t("header.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild>
                <Link to="/auth/login">
                  <FiUser className="mr-2 h-4 w-4" />
                  {t("header.login")}
                </Link>
              </Button>
            )}

            {/* Mobile menu button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  {mobileMenuOpen ? (
                    <FiX className="h-6 w-6" />
                  ) : (
                    <FiMenu className="h-6 w-6" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <nav className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
