import {
  FiBell,
  FiBookOpen,
  FiCalendar,
  FiChevronRight,
  FiUsers,
} from "react-icons/fi";
import { Link } from "react-router";
import { useClassList } from "@/features/class/hooks/useClass";
import { useUnreadCount } from "@/features/notification/hooks/useNotification";
import { useCurrentUser, useRoleText } from "@/stores/useUserStore";

export function UserDashboardPage() {
  const user = useCurrentUser();
  const roleText = useRoleText();
  const { data: classData, isLoading: classLoading } = useClassList();
  const { data: unreadData } = useUnreadCount();

  const classes = classData?.items ?? [];
  const unreadCount = unreadData?.unread_count ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* 欢迎区域 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            学生面板
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            欢迎回来，{user?.display_name || user?.username}（{roleText}）
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/notifications"
            className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiBell className="h-4 w-4" />
            通知
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
          <Link
            to="/user/classes"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <FiBookOpen className="h-4 w-4" />
            我的班级
          </Link>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <FiBookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                已加入班级
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {classes.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20">
              <FiBell className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                未读通知
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {unreadCount}
              </p>
            </div>
          </div>
        </div>
        <Link
          to="/user/classes"
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
              <FiCalendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                查看作业
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                进入
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* 我的班级列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            我的班级
          </h2>
          <Link
            to="/user/classes"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
          >
            查看全部
            <FiChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {classLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="p-12 text-center">
            <FiUsers className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              还没有加入任何班级
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              通过邀请码加入班级开始学习
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {classes.map((cls) => (
              <Link
                key={cls.id}
                to={`/user/classes/${cls.id}`}
                className="flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {cls.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {cls.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {cls.teacher?.display_name ||
                        cls.teacher?.username ||
                        "教师"}
                      <span className="mx-2">·</span>
                      {cls.member_count ?? 0} 人
                    </p>
                  </div>
                </div>
                <FiChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
