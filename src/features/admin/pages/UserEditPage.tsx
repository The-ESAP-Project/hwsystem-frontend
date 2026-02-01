import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { logger } from "@/lib/logger";
import { useUpdateUser, useUser } from "../hooks/useUsers";
import type { UserRole, UserStatus } from "../services/adminUserService";

function useFormSchema() {
  const { t } = useTranslation();
  return useMemo(
    () =>
      z.object({
        email: z
          .string()
          .email(t("validation.invalidEmail"))
          .optional()
          .or(z.literal("")),
        password: z
          .string()
          .min(8, t("userForm.validation.passwordMin"))
          .regex(/[A-Z]/, t("userForm.validation.passwordUppercase"))
          .regex(/[a-z]/, t("userForm.validation.passwordLowercase"))
          .regex(/[0-9]/, t("userForm.validation.passwordNumber"))
          .optional()
          .or(z.literal("")),
        display_name: z
          .string()
          .max(64, t("userForm.validation.displayNameMax"))
          .optional(),
        role: z.enum(["user", "teacher", "admin"] as const),
        status: z.enum(["active", "suspended", "banned"] as const),
      }),
    [t],
  );
}

type FormValues = z.infer<ReturnType<typeof useFormSchema>>;

export default function UserEditPage() {
  const { t } = useTranslation();
  const formSchema = useFormSchema();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const { data: user, isLoading, error } = useUser(userId);
  const updateUser = useUpdateUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      display_name: "",
      role: "user",
      status: "active",
    },
  });

  // 当用户数据加载完成后，填充表单
  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email,
        password: "",
        display_name: user.display_name || "",
        role: user.role,
        status: user.status,
      });
    }
  }, [user, form]);

  const onSubmit = async (values: FormValues) => {
    if (!userId) return;

    try {
      await updateUser.mutateAsync({
        id: userId,
        data: {
          email: values.email || null,
          password: values.password || null,
          display_name: values.display_name || null,
          role: values.role as UserRole,
          status: values.status as UserStatus,
          avatar_url: null,
        },
      });
      navigate(`/admin/users/${userId}`);
    } catch (error) {
      logger.error("Failed to update user", error);
      // 错误已在 hook 中处理
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Card className="max-w-2xl">
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              {error
                ? t("userForm.loadFailed", { message: error.message })
                : t("userForm.userNotFound")}
            </p>
            <Button className="mt-4" onClick={() => navigate("/admin/users")}>
              {t("userForm.backToList")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <FiArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t("userForm.editTitle")}</h1>
          <p className="text-muted-foreground">
            {t("userForm.editSubtitle", { username: user.username })}
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t("userForm.userInfo")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 用户名只读显示 */}
              <div className="space-y-2">
                <label
                  htmlFor="username-display"
                  className="text-sm font-medium"
                >
                  {t("userForm.username")}
                </label>
                <Input
                  id="username-display"
                  value={user.username}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  {t("userForm.usernameReadonly")}
                </p>
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("userForm.email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("userForm.emailPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("userForm.newPassword")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t("userForm.passwordPlaceholderOptional")}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("userForm.passwordDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("userForm.displayName")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("userForm.displayNamePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("userForm.role")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("userForm.rolePlaceholder")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">
                          {t("role.student")}
                        </SelectItem>
                        <SelectItem value="teacher">
                          {t("role.teacher")}
                        </SelectItem>
                        <SelectItem value="admin">{t("role.admin")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("userForm.status")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("userForm.statusPlaceholder")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">
                          {t("status.active")}
                        </SelectItem>
                        <SelectItem value="suspended">
                          {t("status.suspended")}
                        </SelectItem>
                        <SelectItem value="banned">
                          {t("status.banned")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t("userForm.statusDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={updateUser.isPending}>
                  <FiSave className="mr-2 h-4 w-4" />
                  {updateUser.isPending ? t("common.saving") : t("common.save")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/admin/users/${userId}`)}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
