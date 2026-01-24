import { useEffect, useMemo, useState } from "react";
import { FiBook, FiPlus, FiSearch } from "react-icons/fi";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/stores/useUserStore";
import { useHomeworkList } from "../hooks/useHomework";
import { HomeworkListItem } from "./HomeworkListItem";

type TabValue = "all" | "pending" | "submitted" | "graded";
type SortValue = "deadline" | "created";

interface HomeworkListCardProps {
  classId: string;
  isTeacher: boolean;
  basePath: string;
}

export function HomeworkListCard({
  classId,
  isTeacher,
  basePath,
}: HomeworkListCardProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<SortValue>("deadline");
  const [onlyMine, setOnlyMine] = useState(false);
  const currentUser = useCurrentUser();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch data with server-side search
  const { data: homeworkData, isLoading } = useHomeworkList(classId, {
    page_size: 200,
    search: debouncedSearch || undefined,
    created_by:
      isTeacher && onlyMine && currentUser?.id
        ? String(currentUser.id)
        : undefined,
    include_stats: isTeacher,
  });

  const items = homeworkData?.items;

  const filteredItems = useMemo(() => {
    if (!items) return [];
    let result = [...items];

    // Tab filter
    if (activeTab === "pending") {
      result = result.filter((hw) => !hw.my_submission);
    } else if (activeTab === "submitted") {
      result = result.filter(
        (hw) =>
          hw.my_submission &&
          (hw.my_submission.status === "pending" ||
            hw.my_submission.status === "late"),
      );
    } else if (activeTab === "graded") {
      result = result.filter((hw) => hw.my_submission?.status === "graded");
    }

    // Sort
    result.sort((a, b) => {
      if (sort === "deadline") {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      // created (by id desc as proxy)
      return Number(b.id) - Number(a.id);
    });

    return result;
  }, [items, activeTab, sort]);

  const tabCounts = useMemo(() => {
    if (!items) return { all: 0, pending: 0, submitted: 0, graded: 0 };
    return {
      all: items.length,
      pending: items.filter((hw) => !hw.my_submission).length,
      submitted: items.filter(
        (hw) =>
          hw.my_submission &&
          (hw.my_submission.status === "pending" ||
            hw.my_submission.status === "late"),
      ).length,
      graded: items.filter((hw) => hw.my_submission?.status === "graded")
        .length,
    };
  }, [items]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t("homework.list.title")}</CardTitle>
          <CardDescription>
            {t("homework.list.count", { count: items?.length ?? 0 })}
          </CardDescription>
        </div>
        {isTeacher && (
          <Button asChild size="sm">
            <Link to={`${basePath}/homework/create`}>
              <FiPlus className="mr-2 h-4 w-4" />
              {t("homework.list.createHomework")}
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("homework.list.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {isTeacher && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="only-mine"
                checked={onlyMine}
                onCheckedChange={(checked) => setOnlyMine(checked === true)}
              />
              <label
                htmlFor="only-mine"
                className="text-sm cursor-pointer select-none"
              >
                {t("homework.filter.onlyMine")}
              </label>
            </div>
          )}
          <Select value={sort} onValueChange={(v) => setSort(v as SortValue)}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deadline">
                {t("homework.sort.deadline")}
              </SelectItem>
              <SelectItem value="created">
                {t("homework.sort.created")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        {!isTeacher && (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabValue)}
          >
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="all">
                {t("homework.tabs.all")}({tabCounts.all})
              </TabsTrigger>
              <TabsTrigger value="pending">
                {t("homework.tabs.pending")}({tabCounts.pending})
              </TabsTrigger>
              <TabsTrigger value="submitted">
                {t("homework.tabs.submitted")}({tabCounts.submitted})
              </TabsTrigger>
              <TabsTrigger value="graded">
                {t("homework.tabs.graded")}({tabCounts.graded})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <FiBook className="mx-auto h-12 w-12 mb-4" />
            <p>{t("homework.list.empty")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((hw) => (
              <HomeworkListItem
                key={hw.id}
                homework={hw}
                basePath={basePath}
                isTeacher={isTeacher}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
