import { useTranslation } from "react-i18next";
import {
  FiBell,
  FiBook,
  FiClipboard,
  FiHome,
  FiLogOut,
  FiMenu,
  FiSettings,
  FiUsers,
} from "react-icons/fi";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuthEventListener } from "@/hooks/useAuthEventListener";
import {
  useCurrentUser,
  useRoleText,
  useUserAvatar,
  useUserAvatarColor,
  useUserStore,
} from "@/stores/useUserStore";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardLayoutProps {
  navItems: NavItem[];
  title: string;
}

export function DashboardLayout({ navItems, title }: DashboardLayoutProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  useAuthEventListener();

  const currentUser = useCurrentUser();
  const logout = useUserStore((s) => s.logout);
  const avatar = useUserAvatar();
  const avatarColor = useUserAvatarColor();
  const roleText = useRoleText();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b px-4 py-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">HW</span>
              </div>
              <span className="font-semibold">{title}</span>
            </Link>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{t("sidebar.navigation")}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === item.to}
                      >
                        <Link to={item.to}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 px-2"
                >
                  <Avatar className={`h-8 w-8 ${avatarColor}`}>
                    <AvatarFallback className="text-white text-sm">
                      {avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium">
                      {currentUser?.display_name || currentUser?.username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {roleText}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/notifications" className="cursor-pointer">
                    <FiBell className="mr-2 h-4 w-4" />
                    {t("sidebar.notifications")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    <FiSettings className="mr-2 h-4 w-4" />
                    {t("sidebar.settings")}
                  </Link>
                </DropdownMenuItem>
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
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
            <SidebarTrigger>
              <FiMenu className="h-5 w-5" />
            </SidebarTrigger>
          </header>
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

// 预定义的导航配置
export const userNavItems: NavItem[] = [
  { to: "/user/dashboard", label: "仪表盘", icon: FiHome },
  { to: "/user/classes", label: "我的班级", icon: FiBook },
  { to: "/user/submissions", label: "我的提交", icon: FiClipboard },
];

export const teacherNavItems: NavItem[] = [
  { to: "/teacher/dashboard", label: "仪表盘", icon: FiHome },
  { to: "/teacher/classes", label: "班级管理", icon: FiBook },
  { to: "/teacher/students", label: "学生管理", icon: FiUsers },
];

export const adminNavItems: NavItem[] = [
  { to: "/admin/dashboard", label: "仪表盘", icon: FiHome },
  { to: "/admin/users", label: "用户管理", icon: FiUsers },
  { to: "/admin/classes", label: "班级管理", icon: FiBook },
  { to: "/admin/settings", label: "系统设置", icon: FiSettings },
];
