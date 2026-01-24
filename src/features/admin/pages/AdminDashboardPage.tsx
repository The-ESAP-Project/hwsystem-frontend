import {
  FiBookOpen,
  FiChevronRight,
  FiPlus,
  FiSettings,
  FiShield,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import { Link } from "react-router";
import { useUserList } from "@/features/admin/hooks/useUsers";
import { useClassList } from "@/features/class/hooks/useClass";
import { useCurrentUser, useRoleText } from "@/stores/useUserStore";

export function AdminDashboardPage() {
  const user = useCurrentUser();
  const roleText = useRoleText();
  const { data: userData, isLoading: userLoading } = useUserList({
    page: 1,
    page_size: 5,
  });
  const { data: classData } = useClassList();

  const totalUsers = userData?.pagination?.total ?? 0;
  const recentUsers = userData?.items ?? [];
  const totalClasses = classData?.items?.length ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* 欢迎区域 + 快速操作 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            管理面板
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            欢迎回来，{user?.display_name || user?.username}（{roleText}）
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/admin/users/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <FiUserPlus className="h-4 w-4" />
            创建用户
          </Link>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          icon={FiUsers}
          label="用户总数"
          value={totalUsers}
          color="text-blue-600"
          bgColor="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard
          icon={FiBookOpen}
          label="班级数量"
          value={totalClasses}
          color="text-green-600"
          bgColor="bg-green-50 dark:bg-green-900/20"
        />
        <LinkStatCard
          icon={FiShield}
          label="用户管理"
          value="管理"
          color="text-purple-600"
          bgColor="bg-purple-50 dark:bg-purple-900/20"
          to="/admin/users"
        />
        <LinkStatCard
          icon={FiSettings}
          label="班级管理"
          value="管理"
          color="text-orange-600"
          bgColor="bg-orange-50 dark:bg-orange-900/20"
          to="/admin/classes"
        />
      </div>

      {/* 最近用户 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            最近用户
          </h2>
          <Link
            to="/admin/users"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
          >
            查看全部
            <FiChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {userLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : recentUsers.length === 0 ? (
          <div className="p-12 text-center">
            <FiUsers className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              暂无用户数据
            </p>
            <Link
              to="/admin/users/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="h-4 w-4" />
              创建第一个用户
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {(u.display_name || u.username).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <Link
                      to={`/admin/users/${u.id}`}
                      className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {u.display_name || u.username}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {u.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RoleBadge role={u.role} />
                  <StatusBadge status={u.status} />
                  <Link
                    to={`/admin/users/${u.id}`}
                    className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  >
                    <FiChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${bgColor}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function LinkStatCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
  to,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
  bgColor: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${bgColor}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </Link>
  );
}

const roleLabels: Record<string, string> = {
  admin: "管理员",
  teacher: "教师",
  user: "学生",
};

const roleColors: Record<string, string> = {
  admin: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  teacher: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  user: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-md text-xs font-medium ${roleColors[role] || "bg-gray-100 text-gray-600"}`}
    >
      {roleLabels[role] || role}
    </span>
  );
}

const statusColors: Record<string, string> = {
  active: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  banned: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    active: "活跃",
    inactive: "未激活",
    banned: "封禁",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-md text-xs font-medium ${statusColors[status] || "bg-gray-100 text-gray-600"}`}
    >
      {labels[status] || status}
    </span>
  );
}
