import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiBook,
  FiCalendar,
  FiLogIn,
  FiPlus,
  FiSearch,
  FiUsers,
} from "react-icons/fi";
import { Link } from "react-router";
import { Pagination } from "@/components/common/Pagination";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermission } from "@/features/auth/hooks/usePermission";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { CARD_LIST_PAGE_SIZE, CARD_PAGE_SIZE_OPTIONS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { notify } from "@/stores/useNotificationStore";
import { useClassList, useJoinClass } from "../hooks/useClass";
import { useRoutePrefix } from "../hooks/useClassBasePath";

export function ClassListPage() {
  const { t } = useTranslation();
  const [inviteCode, setInviteCode] = useState("");
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(CARD_LIST_PAGE_SIZE);
  const prefix = useRoutePrefix();

  const { search, setSearch, debouncedSearch } = useDebouncedSearch({
    onSearchChange: () => setPage(1),
  });

  const { data, isLoading, error } = useClassList({
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined,
  });
  const { canCreateClass } = usePermission();
  const joinClass = useJoinClass();

  const handleJoinClass = async () => {
    if (!inviteCode.trim()) {
      notify.warning(t("notify.class.inviteCodeRequired"));
      return;
    }
    try {
      await joinClass.mutateAsync(inviteCode.trim());
      notify.success(t("notify.class.joinSuccess"));
      setInviteCode("");
      setIsJoinDialogOpen(false);
    } catch (error) {
      logger.error("Failed to join class", error);
      notify.error(
        t("notify.class.joinFailed"),
        t("notify.class.inviteCodeInvalid"),
      );
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case "teacher":
        return t("classPage.roleTeacher");
      case "class_representative":
        return t("classPage.roleRepresentative");
      default:
        return t("classPage.roleStudent");
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-destructive">
          {t("common.loadError")}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* 头部 */}
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("classPage.title")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t("classPage.description")}
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FiLogIn className="mr-2 h-4 w-4" />
                {t("classPage.joinClass")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("classPage.joinDialog.title")}</DialogTitle>
                <DialogDescription>
                  {t("classPage.joinDialog.description")}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder={t("classPage.joinDialog.placeholder")}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinClass()}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsJoinDialogOpen(false)}
                >
                  {t("classPage.joinDialog.cancel")}
                </Button>
                <Button
                  onClick={handleJoinClass}
                  disabled={joinClass.isPending}
                >
                  {joinClass.isPending
                    ? t("classPage.joinDialog.joining")
                    : t("classPage.joinDialog.join")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {canCreateClass && (
            <Button asChild>
              <Link to={`${prefix}/classes/create`}>
                <FiPlus className="mr-2 h-4 w-4" />
                {t("classPage.createClass")}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="relative max-w-sm mb-6">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("classPage.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 班级列表 */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FiBook className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">
              {t("classPage.noClasses")}
            </h3>
            <p className="mt-2 text-muted-foreground">
              {canCreateClass
                ? t("classPage.noClassesTeacherHint")
                : t("classPage.noClassesStudentHint")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((cls) => (
            <Link key={cls.id} to={`${prefix}/classes/${cls.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FiBook className="h-5 w-5 text-primary" />
                    {cls.name}
                  </CardTitle>
                  <CardDescription>{cls.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <FiUsers className="h-4 w-4" />
                      <span>
                        {t("classPage.members", {
                          count: Number(cls.member_count),
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {t("classPage.teacher")}：
                      </span>
                      <span>
                        {cls.teacher?.display_name || cls.teacher?.username}
                      </span>
                    </div>
                    {cls.my_role && (
                      <div className="flex items-center gap-2">
                        <FiCalendar className="h-4 w-4" />
                        <span>
                          {t("classPage.myRole")}：{getRoleText(cls.my_role)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* 分页 */}
      {data?.pagination && (
        <Pagination
          current={page}
          total={Number(data.pagination.total)}
          pageSize={pageSize}
          pageSizeOptions={CARD_PAGE_SIZE_OPTIONS}
          onChange={(newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          }}
          showTotal
          showSizeChanger
          className="mt-6"
        />
      )}
    </div>
  );
}
