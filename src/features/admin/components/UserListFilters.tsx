import { useTranslation } from "react-i18next";
import { FiSearch } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRole, UserStatus } from "../services/adminUserService";

interface UserListFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  roleFilter: UserRole | "all";
  setRoleFilter: (value: UserRole | "all") => void;
  statusFilter: UserStatus | "all";
  setStatusFilter: (value: UserStatus | "all") => void;
  onFilterChange?: () => void;
}

export function UserListFilters({
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  onFilterChange,
}: UserListFiltersProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("userList.filters")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("userList.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={roleFilter}
            onValueChange={(v) => {
              setRoleFilter(v as UserRole | "all");
              onFilterChange?.();
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t("userForm.role")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("userList.allRoles")}</SelectItem>
              <SelectItem value="admin">{t("role.admin")}</SelectItem>
              <SelectItem value="teacher">{t("role.teacher")}</SelectItem>
              <SelectItem value="user">{t("role.student")}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as UserStatus | "all");
              onFilterChange?.();
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t("userForm.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("userList.allStatuses")}</SelectItem>
              <SelectItem value="active">{t("status.active")}</SelectItem>
              <SelectItem value="suspended">{t("status.suspended")}</SelectItem>
              <SelectItem value="banned">{t("status.banned")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
