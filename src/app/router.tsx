import { createBrowserRouter, redirect } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";

// 布局组件
import { DefaultLayout } from "@/components/layout/DefaultLayout";
// 管理员页面
import { AdminDashboardPage } from "@/features/admin/pages/AdminDashboardPage";
import UserCreatePage from "@/features/admin/pages/UserCreatePage";
import UserDetailPage from "@/features/admin/pages/UserDetailPage";
import UserEditPage from "@/features/admin/pages/UserEditPage";
import UserListPage from "@/features/admin/pages/UserListPage";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
// 认证页面
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { ClassCreatePage } from "@/features/class/pages/ClassCreatePage";
import { ClassDetailPage } from "@/features/class/pages/ClassDetailPage";
import { ClassEditPage } from "@/features/class/pages/ClassEditPage";
// 班级页面
import { ClassListPage } from "@/features/class/pages/ClassListPage";
import { ClassStudentsPage } from "@/features/class/pages/ClassStudentsPage";
// 评分页面
import { GradePage } from "@/features/grade/pages/GradePage";
import { HomeworkCreatePage } from "@/features/homework/pages/HomeworkCreatePage";
// 作业页面
import { HomeworkDetailPage } from "@/features/homework/pages/HomeworkDetailPage";
import { HomeworkEditPage } from "@/features/homework/pages/HomeworkEditPage";
import { HomeworkStatsPage } from "@/features/homework/pages/HomeworkStatsPage";
// 通知页面
import { NotificationListPage } from "@/features/notification/pages/NotificationListPage";
import { AboutPage } from "@/features/public/pages/AboutPage";
import { ContactPage } from "@/features/public/pages/ContactPage";
// 公共页面
import { HomePage } from "@/features/public/pages/HomePage";
import { NotFoundPage } from "@/features/public/pages/NotFoundPage";
import { PrivacyPage } from "@/features/public/pages/PrivacyPage";
import { TermsPage } from "@/features/public/pages/TermsPage";
import { MySubmissionsPage } from "@/features/submission/pages/MySubmissionsPage";
import { SubmissionListPage } from "@/features/submission/pages/SubmissionListPage";
// 提交页面
import { SubmitHomeworkPage } from "@/features/submission/pages/SubmitHomeworkPage";
import { TeacherDashboardPage } from "@/features/teacher/pages/TeacherDashboardPage";
// 教师页面
import { TeacherIndexPage } from "@/features/teacher/pages/TeacherIndexPage";
import { HomeworkPage } from "@/features/user/pages/HomeworkPage";
import { UserDashboardPage } from "@/features/user/pages/UserDashboardPage";
// 学生页面
import { UserIndexPage } from "@/features/user/pages/UserIndexPage";
import { useUserStore } from "@/stores/useUserStore";

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

export const router = createBrowserRouter([
  // 公共页面 (DefaultLayout)
  {
    path: "/",
    element: <DefaultLayout />,
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
    element: <DefaultLayout />,
    loader: requireRole(["user", "teacher", "admin"]),
    children: [
      { index: true, element: <UserIndexPage /> },
      { path: "dashboard", element: <UserDashboardPage /> },
      { path: "homework/:id", element: <HomeworkPage /> },
      // 班级
      { path: "classes", element: <ClassListPage /> },
      { path: "classes/:classId", element: <ClassDetailPage /> },
      // 作业详情
      {
        path: "classes/:classId/homework/:homeworkId",
        element: <HomeworkDetailPage />,
      },
      // 提交作业
      {
        path: "classes/:classId/homework/:homeworkId/submit",
        element: <SubmitHomeworkPage />,
      },
      // 我的提交历史
      {
        path: "homework/:homeworkId/submissions",
        element: <MySubmissionsPage />,
      },
    ],
  },

  // 通知页面 (所有登录用户可访问)
  {
    path: "/notifications",
    element: <DefaultLayout />,
    loader: requireRole(["user", "teacher", "admin"]),
    children: [{ index: true, element: <NotificationListPage /> }],
  },

  // 教师页面 (teacher 和 admin 可访问)
  {
    path: "/teacher",
    element: <DefaultLayout />,
    loader: requireRole(["teacher", "admin"]),
    children: [
      { index: true, element: <TeacherIndexPage /> },
      { path: "dashboard", element: <TeacherDashboardPage /> },
      // 班级管理
      { path: "classes", element: <ClassListPage /> },
      { path: "classes/create", element: <ClassCreatePage /> },
      { path: "classes/:classId", element: <ClassDetailPage /> },
      { path: "classes/:classId/edit", element: <ClassEditPage /> },
      { path: "classes/:classId/students", element: <ClassStudentsPage /> },
      // 作业管理
      {
        path: "classes/:classId/homework/create",
        element: <HomeworkCreatePage />,
      },
      {
        path: "classes/:classId/homework/:homeworkId",
        element: <HomeworkDetailPage />,
      },
      {
        path: "classes/:classId/homework/:homeworkId/edit",
        element: <HomeworkEditPage />,
      },
      {
        path: "classes/:classId/homework/:homeworkId/stats",
        element: <HomeworkStatsPage />,
      },
      {
        path: "classes/:classId/homework/:homeworkId/submissions",
        element: <SubmissionListPage />,
      },
      // 评分
      { path: "submissions/:submissionId/grade", element: <GradePage /> },
    ],
  },

  // 管理员页面 (仅 admin)
  {
    path: "/admin",
    element: <DefaultLayout />,
    loader: requireRole(["admin"]),
    children: [
      { path: "dashboard", element: <AdminDashboardPage /> },
      // 用户管理
      { path: "users", element: <UserListPage /> },
      { path: "users/create", element: <UserCreatePage /> },
      { path: "users/:userId", element: <UserDetailPage /> },
      { path: "users/:userId/edit", element: <UserEditPage /> },
      // 所有班级
      { path: "classes", element: <ClassListPage /> },
    ],
  },

  // 404
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
