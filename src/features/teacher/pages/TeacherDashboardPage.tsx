import {
  FiBookOpen,
  FiChevronRight,
  FiClipboard,
  FiEdit,
  FiPlus,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import { Link } from "react-router";
import { useClassList } from "@/features/class/hooks/useClass";
import { useCurrentUser, useRoleText } from "@/stores/useUserStore";

export function TeacherDashboardPage() {
  const user = useCurrentUser();
  const roleText = useRoleText();
  const { data: classData, isLoading } = useClassList();

  const classes = classData?.items ?? [];
  const totalStudents = classes.reduce(
    (sum, cls) => sum + Number(cls.member_count ?? 0),
    0,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* 欢迎区域 + 快速操作 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            教师面板
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            欢迎回来，{user?.display_name || user?.username}（{roleText}）
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/teacher/classes/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="h-4 w-4" />
            创建班级
          </Link>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <StatCard
          icon={FiBookOpen}
          label="管理班级"
          value={classes.length}
          color="text-blue-600"
          bgColor="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard
          icon={FiUsers}
          label="学生总数"
          value={totalStudents}
          color="text-green-600"
          bgColor="bg-green-50 dark:bg-green-900/20"
        />
        <StatCard
          icon={FiClipboard}
          label="快速操作"
          value="管理"
          color="text-purple-600"
          bgColor="bg-purple-50 dark:bg-purple-900/20"
          isLink
          to="/teacher/classes"
        />
      </div>

      {/* 班级列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            我的班级
          </h2>
          <Link
            to="/teacher/classes"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
          >
            查看全部
            <FiChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
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
            <FiBookOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              还没有创建班级
            </p>
            <Link
              to="/teacher/classes/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="h-4 w-4" />
              创建第一个班级
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {cls.name.charAt(0)}
                    </div>
                    <div>
                      <Link
                        to={`/teacher/classes/${cls.id}`}
                        className="text-base font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {cls.name}
                      </Link>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {cls.description || "暂无描述"}
                        <span className="mx-2">·</span>
                        {cls.member_count ?? 0} 名学生
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/teacher/classes/${cls.id}/students`}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                      title="管理学生"
                    >
                      <FiUserPlus className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/teacher/classes/${cls.id}/edit`}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                      title="编辑班级"
                    >
                      <FiEdit className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/teacher/classes/${cls.id}`}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                      title="查看详情"
                    >
                      <FiChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
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
  isLink,
  to,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
  isLink?: boolean;
  to?: string;
}) {
  const content = (
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
  );

  if (isLink && to) {
    return (
      <Link
        to={to}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      {content}
    </div>
  );
}
