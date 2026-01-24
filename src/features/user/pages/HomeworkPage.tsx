import { useParams } from "react-router";

export function HomeworkPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        作业详情
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">作业 ID: {id}</p>
    </div>
  );
}
