import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FiSave, FiUser } from "react-icons/fi";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { logger } from "@/lib/logger";
import { notify } from "@/stores/useNotificationStore";
import { useCurrentUser } from "@/stores/useUserStore";
import { useUpdateProfile } from "../hooks/useSettings";

// 使用函数创建 schema 以支持 i18n
function createFormSchema(t: (key: string) => string) {
  return z
    .object({
      display_name: z
        .string()
        .max(50, t("settings.validation.displayNameMaxLength"))
        .optional(),
      email: z
        .string()
        .email(t("settings.validation.invalidEmail"))
        .optional()
        .or(z.literal("")),
      password: z
        .string()
        .min(6, t("settings.validation.passwordMinLength"))
        .optional()
        .or(z.literal("")),
      confirm_password: z.string().optional().or(z.literal("")),
      avatar_url: z
        .string()
        .url(t("settings.validation.invalidUrl"))
        .optional()
        .or(z.literal("")),
    })
    .refine(
      (data) => {
        if (data.password && data.password !== data.confirm_password) {
          return false;
        }
        return true;
      },
      {
        message: t("settings.validation.passwordMismatch"),
        path: ["confirm_password"],
      },
    );
}

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

export function SettingsPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const updateProfile = useUpdateProfile();

  const formSchema = createFormSchema(t);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      display_name: user?.display_name || "",
      email: user?.email || "",
      password: "",
      confirm_password: "",
      avatar_url: user?.avatar_url || "",
    },
  });

  // 当用户信息变化时重置表单
  useEffect(() => {
    if (user) {
      form.reset({
        display_name: user.display_name || "",
        email: user.email || "",
        password: "",
        confirm_password: "",
        avatar_url: user.avatar_url || "",
      });
    }
  }, [user, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      // 只发送有变化的字段
      const updateData: {
        display_name?: string | null;
        email?: string | null;
        password?: string | null;
        avatar_url?: string | null;
      } = {};

      if (values.display_name !== (user?.display_name || "")) {
        updateData.display_name = values.display_name || null;
      }

      if (values.email !== (user?.email || "")) {
        updateData.email = values.email || null;
      }

      if (values.password) {
        updateData.password = values.password;
      }

      if (values.avatar_url !== (user?.avatar_url || "")) {
        updateData.avatar_url = values.avatar_url || null;
      }

      // 如果没有任何变化，提示用户
      if (Object.keys(updateData).length === 0) {
        notify.info(t("notify.settings.noChanges"));
        return;
      }

      await updateProfile.mutateAsync(updateData);
      notify.success(t("notify.settings.updated"));

      // 清空密码字段
      form.setValue("password", "");
      form.setValue("confirm_password", "");
    } catch (error) {
      logger.error("Failed to update profile", error);
      notify.error(
        t("notify.settings.updateFailed"),
        t("notify.tryAgainLater"),
      );
    }
  };

  const getInitial = () => {
    if (user?.display_name) {
      return user.display_name[0].toUpperCase();
    }
    if (user?.username) {
      return user.username[0].toUpperCase();
    }
    return "?";
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("settings.subtitle")}</p>
      </div>

      <div className="space-y-6">
        {/* 用户信息卡片 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.avatar_url || undefined} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {getInitial()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{user?.display_name || user?.username}</CardTitle>
                <CardDescription>@{user?.username}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 编辑表单 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiUser className="h-5 w-5" />
              {t("settings.profile.title")}
            </CardTitle>
            <CardDescription>
              {t("settings.profile.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* 用户名（只读） */}
                <div>
                  <label
                    htmlFor="username-readonly"
                    className="text-sm font-medium"
                  >
                    {t("settings.fields.username")}
                  </label>
                  <Input
                    id="username-readonly"
                    value={user?.username || ""}
                    disabled
                    className="mt-2 bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("settings.fields.usernameReadonly")}
                  </p>
                </div>

                {/* 显示名称 */}
                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.fields.displayName")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            "settings.fields.displayNamePlaceholder",
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("settings.fields.displayNameDescription")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 邮箱 */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.fields.email")}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t("settings.fields.emailPlaceholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 新密码 */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.fields.password")}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={t("settings.fields.passwordPlaceholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("settings.fields.passwordDescription")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 确认密码 */}
                <FormField
                  control={form.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("settings.fields.confirmPassword")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={t(
                            "settings.fields.confirmPasswordPlaceholder",
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 头像 URL */}
                <FormField
                  control={form.control}
                  name="avatar_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.fields.avatarUrl")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            "settings.fields.avatarUrlPlaceholder",
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("settings.fields.avatarUrlDescription")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={updateProfile.isPending}>
                  <FiSave className="mr-2 h-4 w-4" />
                  {updateProfile.isPending
                    ? t("settings.submitting")
                    : t("settings.submit")}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
