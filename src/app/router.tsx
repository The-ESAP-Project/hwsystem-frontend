import { lazy, Suspense } from "react";
import { createBrowserRouter, redirect } from "react-router";
import { RouteErrorBoundary } from "@/components/common/RouteErrorBoundary";
import { AppLayout } from "@/components/layout/AppLayout";

// 布局组件
import {
  adminNavItems,
  DashboardLayout,
  teacherNavItems,
  userNavItems,
} from "@/components/layout/DashboardLayout";
import { DefaultLayout } from "@/components/layout/DefaultLayout";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
// 认证页面
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { AboutPage } from "@/features/public/pages/AboutPage";
import { ContactPage } from "@/features/public/pages/ContactPage";
// ============ 同步加载（首屏/入口页面）============
// 公共页面
import { HomePage } from "@/features/public/pages/HomePage";
import { NotFoundPage } from "@/features/public/pages/NotFoundPage";
import { PrivacyPage } from "@/features/public/pages/PrivacyPage";
import { TermsPage } from "@/features/public/pages/TermsPage";
import { TeacherIndexPage } from "@/features/teacher/pages/TeacherIndexPage";
// Index 页面
import { UserIndexPage } from "@/features/user/pages/UserIndexPage";

// ============ 懒加载（二级页面/低频页面）============
// 管理员页面
const AdminDashboardPage = lazy(() =>
  import("@/features/admin/pages/AdminDashboardPage").then((m) => ({
    default: m.AdminDashboardPage,
  })),
);
const ClassManagementPage = lazy(
  () => import("@/features/admin/pages/ClassManagementPage"),
);
const SystemSettingsPage = lazy(() =>
  import("@/features/admin/pages/SystemSettingsPage").then((m) => ({
    default: m.SystemSettingsPage,
  })),
);
const UserCreatePage = lazy(
  () => import("@/features/admin/pages/UserCreatePage"),
);
const UserDetailPage = lazy(
  () => import("@/features/admin/pages/UserDetailPage"),
);
const UserEditPage = lazy(() => import("@/features/admin/pages/UserEditPage"));
const UserListPage = lazy(() => import("@/features/admin/pages/UserListPage"));

// 班级页面
import { ClassListPage } from "@/features/class/pages/ClassListPage";

const ClassCreatePage = lazy(() =>
  import("@/features/class/pages/ClassCreatePage").then((m) => ({
    default: m.ClassCreatePage,
  })),
);
const ClassDetailPage = lazy(() =>
  import("@/features/class/pages/ClassDetailPage").then((m) => ({
    default: m.ClassDetailPage,
  })),
);
const ClassEditPage = lazy(() =>
  import("@/features/class/pages/ClassEditPage").then((m) => ({
    default: m.ClassEditPage,
  })),
);
const ClassStudentsPage = lazy(() =>
  import("@/features/class/pages/ClassStudentsPage").then((m) => ({
    default: m.ClassStudentsPage,
  })),
);
// 评分页面
const GradePage = lazy(() =>
  import("@/features/grade/pages/GradePage").then((m) => ({
    default: m.GradePage,
  })),
);
// 作业页面
const HomeworkCreatePage = lazy(() =>
  import("@/features/homework/pages/HomeworkCreatePage").then((m) => ({
    default: m.HomeworkCreatePage,
  })),
);
const HomeworkDetailPage = lazy(() =>
  import("@/features/homework/pages/HomeworkDetailPage").then((m) => ({
    default: m.HomeworkDetailPage,
  })),
);
const HomeworkEditPage = lazy(() =>
  import("@/features/homework/pages/HomeworkEditPage").then((m) => ({
    default: m.HomeworkEditPage,
  })),
);
const HomeworkStatsPage = lazy(() =>
  import("@/features/homework/pages/HomeworkStatsPage").then((m) => ({
    default: m.HomeworkStatsPage,
  })),
);
const MyHomeworksPage = lazy(() =>
  import("@/features/homework/pages/MyHomeworksPage").then((m) => ({
    default: m.MyHomeworksPage,
  })),
);
const TeacherHomeworksPage = lazy(() =>
  import("@/features/homework/pages/TeacherHomeworksPage").then((m) => ({
    default: m.TeacherHomeworksPage,
  })),
);
// 通知页面
const NotificationListPage = lazy(() =>
  import("@/features/notification/pages/NotificationListPage").then((m) => ({
    default: m.NotificationListPage,
  })),
);
// 设置页面
const SettingsPage = lazy(() =>
  import("@/features/settings/pages/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  })),
);
// 提交页面
const MySubmissionsPage = lazy(() =>
  import("@/features/submission/pages/MySubmissionsPage").then((m) => ({
    default: m.MySubmissionsPage,
  })),
);
const SubmissionListPage = lazy(() =>
  import("@/features/submission/pages/SubmissionListPage").then((m) => ({
    default: m.SubmissionListPage,
  })),
);
const SubmitHomeworkPage = lazy(() =>
  import("@/features/submission/pages/SubmitHomeworkPage").then((m) => ({
    default: m.SubmitHomeworkPage,
  })),
);
// 教师页面
const TeacherDashboardPage = lazy(() =>
  import("@/features/teacher/pages/TeacherDashboardPage").then((m) => ({
    default: m.TeacherDashboardPage,
  })),
);
// 学生页面
const UserDashboardPage = lazy(() =>
  import("@/features/user/pages/UserDashboardPage").then((m) => ({
    default: m.UserDashboardPage,
  })),
);

import { useCurrentUser, useUserStore } from "@/stores/useUserStore";

// 懒加载包装器
function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">Loading...</div>
      }
    >
      {children}
    </Suspense>
  );
}

// 路由守卫 Loader
const requireAuth = async () => {
  const { initAuth, isInitialized } = useUserStore.getState();

  // 等待初始化完成
  if (!isInitialized) {
    await initAuth();
  }

  // 检查认证状态
  const user = useUserStore.getState().currentUser;
  if (!user) {
    throw redirect("/auth/login");
  }

  return { user };
};

const requireRole = (roles: string[]) => async () => {
  const { user } = await requireAuth();

  if (!roles.includes(user.role)) {
    // 重定向到对应的 Dashboard
    const dashboardMap: Record<string, string> = {
      admin: "/admin/dashboard",
      teacher: "/teacher/dashboard",
      user: "/user/dashboard",
    };
    throw redirect(dashboardMap[user.role] || "/");
  }

  return { user };
};

const requireGuest = async () => {
  const { isInitialized, initAuth } = useUserStore.getState();

  if (!isInitialized) {
    await initAuth();
  }

  const user = useUserStore.getState().currentUser;
  if (user) {
    const dashboardMap: Record<string, string> = {
      admin: "/admin/dashboard",
      teacher: "/teacher/dashboard",
      user: "/user/dashboard",
    };
    throw redirect(dashboardMap[user.role] || "/");
  }

  return null;
};

// 通知页面布局组件 - 根据用户角色选择对应的导航项
function NotificationLayout() {
  const user = useCurrentUser();
  const navItems =
    user?.role === "admin"
      ? adminNavItems
      : user?.role === "teacher"
        ? teacherNavItems
        : userNavItems;

  return (
    <DashboardLayout navItems={navItems} titleKey="common.notifications" />
  );
}

// 设置页面布局组件 - 根据用户角色选择对应的导航项
function SettingsLayout() {
  const user = useCurrentUser();
  const navItems =
    user?.role === "admin"
      ? adminNavItems
      : user?.role === "teacher"
        ? teacherNavItems
        : userNavItems;

  return <DashboardLayout navItems={navItems} titleKey="common.settings" />;
}

export const router = createBrowserRouter([
  // 公共页面 (DefaultLayout)
  {
    path: "/",
    element: <DefaultLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "about", element: <AboutPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "privacy", element: <PrivacyPage /> },
      { path: "terms", element: <TermsPage /> },
    ],
  },

  // 认证页面 (需要未登录)
  {
    path: "/auth",
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    loader: requireGuest,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
    ],
  },

  // 学生页面 (所有角色可访问)
  {
    path: "/user",
    element: (
      <DashboardLayout
        navItems={userNavItems}
        titleKey="dashboard.user.title"
      />
    ),
    errorElement: <RouteErrorBoundary />,
    loader: requireRole(["user", "teacher", "admin"]),
    children: [
      { index: true, element: <UserIndexPage /> },
      {
        path: "dashboard",
        element: (
          <LazyPage>
            <UserDashboardPage />
          </LazyPage>
        ),
      },
      // 班级
      { path: "classes", element: <ClassListPage /> },
      {
        path: "classes/:classId",
        element: (
          <LazyPage>
            <ClassDetailPage />
          </LazyPage>
        ),
      },
      // 作业详情
      {
        path: "classes/:classId/homework/:homeworkId",
        element: (
          <LazyPage>
            <HomeworkDetailPage />
          </LazyPage>
        ),
      },
      // 作业统计（课代表可访问）
      {
        path: "classes/:classId/homework/:homeworkId/stats",
        element: (
          <LazyPage>
            <HomeworkStatsPage />
          </LazyPage>
        ),
      },
      // 提交列表（课代表可访问）
      {
        path: "classes/:classId/homework/:homeworkId/submissions",
        element: (
          <LazyPage>
            <SubmissionListPage />
          </LazyPage>
        ),
      },
      // 提交作业
      {
        path: "classes/:classId/homework/:homeworkId/submit",
        element: (
          <LazyPage>
            <SubmitHomeworkPage />
          </LazyPage>
        ),
      },
      // 我的提交历史
      {
        path: "homework/:homeworkId/submissions",
        element: (
          <LazyPage>
            <MySubmissionsPage />
          </LazyPage>
        ),
      },
      // 我的所有提交
      {
        path: "homeworks",
        element: (
          <LazyPage>
            <MyHomeworksPage />
          </LazyPage>
        ),
      },
    ],
  },

  // 通知页面 (所有登录用户可访问，根据角色显示对应导航)
  {
    path: "/notifications",
    element: <NotificationLayout />,
    errorElement: <RouteErrorBoundary />,
    loader: requireRole(["user", "teacher", "admin"]),
    children: [
      {
        index: true,
        element: (
          <LazyPage>
            <NotificationListPage />
          </LazyPage>
        ),
      },
    ],
  },

  // 设置页面 (所有登录用户可访问)
  {
    path: "/settings",
    element: <SettingsLayout />,
    errorElement: <RouteErrorBoundary />,
    loader: requireRole(["user", "teacher", "admin"]),
    children: [
      {
        index: true,
        element: (
          <LazyPage>
            <SettingsPage />
          </LazyPage>
        ),
      },
    ],
  },

  // 教师页面 (teacher 和 admin 可访问)
  {
    path: "/teacher",
    element: (
      <DashboardLayout
        navItems={teacherNavItems}
        titleKey="dashboard.teacher.title"
      />
    ),
    errorElement: <RouteErrorBoundary />,
    loader: requireRole(["teacher", "admin"]),
    children: [
      { index: true, element: <TeacherIndexPage /> },
      {
        path: "dashboard",
        element: (
          <LazyPage>
            <TeacherDashboardPage />
          </LazyPage>
        ),
      },
      // 已布置作业
      {
        path: "homeworks",
        element: (
          <LazyPage>
            <TeacherHomeworksPage />
          </LazyPage>
        ),
      },
      // 班级管理
      { path: "classes", element: <ClassListPage /> },
      {
        path: "classes/create",
        element: (
          <LazyPage>
            <ClassCreatePage />
          </LazyPage>
        ),
      },
      {
        path: "classes/:classId",
        element: (
          <LazyPage>
            <ClassDetailPage />
          </LazyPage>
        ),
      },
      {
        path: "classes/:classId/edit",
        element: (
          <LazyPage>
            <ClassEditPage />
          </LazyPage>
        ),
      },
      {
        path: "classes/:classId/students",
        element: (
          <LazyPage>
            <ClassStudentsPage />
          </LazyPage>
        ),
      },
      // 作业管理
      {
        path: "classes/:classId/homework/create",
        element: (
          <LazyPage>
            <HomeworkCreatePage />
          </LazyPage>
        ),
      },
      {
        path: "classes/:classId/homework/:homeworkId",
        element: (
          <LazyPage>
            <HomeworkDetailPage />
          </LazyPage>
        ),
      },
      {
        path: "classes/:classId/homework/:homeworkId/edit",
        element: (
          <LazyPage>
            <HomeworkEditPage />
          </LazyPage>
        ),
      },
      {
        path: "classes/:classId/homework/:homeworkId/stats",
        element: (
          <LazyPage>
            <HomeworkStatsPage />
          </LazyPage>
        ),
      },
      {
        path: "classes/:classId/homework/:homeworkId/submissions",
        element: (
          <LazyPage>
            <SubmissionListPage />
          </LazyPage>
        ),
      },
      // 评分
      {
        path: "submissions/:submissionId/grade",
        element: (
          <LazyPage>
            <GradePage />
          </LazyPage>
        ),
      },
    ],
  },

  // 管理员页面 (仅 admin)
  {
    path: "/admin",
    element: (
      <DashboardLayout
        navItems={adminNavItems}
        titleKey="dashboard.admin.title"
      />
    ),
    errorElement: <RouteErrorBoundary />,
    loader: requireRole(["admin"]),
    children: [
      {
        path: "dashboard",
        element: (
          <LazyPage>
            <AdminDashboardPage />
          </LazyPage>
        ),
      },
      // 用户管理
      {
        path: "users",
        element: (
          <LazyPage>
            <UserListPage />
          </LazyPage>
        ),
      },
      {
        path: "users/create",
        element: (
          <LazyPage>
            <UserCreatePage />
          </LazyPage>
        ),
      },
      {
        path: "users/:userId",
        element: (
          <LazyPage>
            <UserDetailPage />
          </LazyPage>
        ),
      },
      {
        path: "users/:userId/edit",
        element: (
          <LazyPage>
            <UserEditPage />
          </LazyPage>
        ),
      },
      // 班级管理
      {
        path: "classes",
        element: (
          <LazyPage>
            <ClassManagementPage />
          </LazyPage>
        ),
      },
      {
        path: "classes/create",
        element: (
          <LazyPage>
            <ClassCreatePage />
          </LazyPage>
        ),
      },
      {
        path: "classes/:classId",
        element: (
          <LazyPage>
            <ClassDetailPage />
          </LazyPage>
        ),
      },
      {
        path: "classes/:classId/edit",
        element: (
          <LazyPage>
            <ClassEditPage />
          </LazyPage>
        ),
      },
      {
        path: "classes/:classId/students",
        element: (
          <LazyPage>
            <ClassStudentsPage />
          </LazyPage>
        ),
      },
      {
        path: "classes/:classId/homework/create",
        element: (
          <LazyPage>
            <HomeworkCreatePage />
          </LazyPage>
        ),
      },
      {
        path: "classes/:classId/homework/:homeworkId",
        element: (
          <LazyPage>
            <HomeworkDetailPage />
          </LazyPage>
        ),
      },
      {
        path: "classes/:classId/homework/:homeworkId/edit",
        element: (
          <LazyPage>
            <HomeworkEditPage />
          </LazyPage>
        ),
      },
      {
        path: "classes/:classId/homework/:homeworkId/stats",
        element: (
          <LazyPage>
            <HomeworkStatsPage />
          </LazyPage>
        ),
      },
      {
        path: "classes/:classId/homework/:homeworkId/submissions",
        element: (
          <LazyPage>
            <SubmissionListPage />
          </LazyPage>
        ),
      },
      {
        path: "classes/:classId/homework/:homeworkId/submit",
        element: (
          <LazyPage>
            <SubmitHomeworkPage />
          </LazyPage>
        ),
      },
      {
        path: "submissions/:submissionId/grade",
        element: (
          <LazyPage>
            <GradePage />
          </LazyPage>
        ),
      },
      // 系统设置
      {
        path: "settings",
        element: (
          <LazyPage>
            <SystemSettingsPage />
          </LazyPage>
        ),
      },
    ],
  },

  // 404
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
