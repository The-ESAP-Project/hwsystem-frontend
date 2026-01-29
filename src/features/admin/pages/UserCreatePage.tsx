import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import { useNavigate } from "react-router";
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
import { logger } from "@/lib/logger";
import { useCreateUser } from "../hooks/useUsers";
import type { UserRole } from "../services/userService";

function useFormSchema() {
  const { t } = useTranslation();
  return useMemo(
    () =>
      z.object({
        username: z
          .string()
          .min(5, t("userForm.validation.usernameMin"))
          .max(16, t("userForm.validation.usernameMax"))
          .regex(/^[A-Za-z0-9_-]+$/, t("userForm.validation.usernameFormat")),
        email: z.string().email(t("validation.invalidEmail")),
        password: z
          .string()
          .min(8, t("userForm.validation.passwordMin"))
          .regex(/[A-Z]/, t("userForm.validation.passwordUppercase"))
          .regex(/[a-z]/, t("userForm.validation.passwordLowercase"))
          .regex(/[0-9]/, t("userForm.validation.passwordNumber")),
        display_name: z
          .string()
          .max(64, t("userForm.validation.displayNameMax"))
          .optional(),
        role: z.enum(["user", "teacher", "admin"] as const),
      }),
    [t],
  );
}

type FormValues = z.infer<ReturnType<typeof useFormSchema>>;

export default function UserCreatePage() {
  const { t } = useTranslation();
  const formSchema = useFormSchema();
  const navigate = useNavigate();
  const createUser = useCreateUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      display_name: "",
      role: "user",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await createUser.mutateAsync({
        username: values.username,
        email: values.email,
        password: values.password,
        role: values.role as UserRole,
        display_name: values.display_name || null,
        avatar_url: null,
      });
      navigate("/admin/users");
    } catch (error) {
      logger.error("Failed to create user", error);
      // 错误已在 hook 中处理
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <FiArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t("userForm.createTitle")}</h1>
          <p className="text-muted-foreground">
            {t("userForm.createSubtitle")}
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
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("userForm.usernameRequired")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("userForm.usernamePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("userForm.usernameDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("userForm.emailRequired")}</FormLabel>
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
                    <FormLabel>{t("userForm.passwordRequired")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t("userForm.passwordPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("userForm.passwordRequirements")}
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
                    <FormDescription>
                      {t("userForm.displayNameDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("userForm.roleRequired")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                    <FormDescription>
                      {t("userForm.roleDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={createUser.isPending}>
                  <FiSave className="mr-2 h-4 w-4" />
                  {createUser.isPending
                    ? t("common.creating")
                    : t("userForm.createUser")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/users")}
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
