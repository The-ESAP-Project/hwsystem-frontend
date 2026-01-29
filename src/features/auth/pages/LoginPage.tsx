import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Link, useNavigate } from "react-router";
import { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiError } from "@/hooks/useApiError";
import { useUserStore } from "@/stores/useUserStore";

const loginSchema = z.object({
  username: z.string().min(1, "auth.login.validation.usernameRequired"),
  password: z.string().min(1, "auth.login.validation.passwordRequired"),
  remember_me: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const login = useUserStore((s) => s.login);
  const isLoading = useUserStore((s) => s.isLoading);
  const { handleError } = useApiError();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      remember_me: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const user = await login(data);
      const dashboardMap: Record<string, string> = {
        admin: "/admin/dashboard",
        teacher: "/teacher/dashboard",
        user: "/user/dashboard",
      };
      navigate(dashboardMap[user.role] || "/");
    } catch (error: unknown) {
      handleError(error, { title: t("auth.login.validation.loginFailed") });
    }
  };

  return (
    <div className="w-full max-w-md px-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center mb-4">
            <span className="text-white font-bold text-lg">HW</span>
          </div>
          <CardTitle className="text-2xl">{t("auth.login.title")}</CardTitle>
          <CardDescription>{t("auth.login.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.login.username")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete="username"
                        placeholder={t("auth.login.usernamePlaceholder")}
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
                    <FormLabel>{t("auth.login.password")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder={t("auth.login.passwordPlaceholder")}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={
                            showPassword
                              ? t("auth.login.hidePassword")
                              : t("auth.login.showPassword")
                          }
                        >
                          {showPassword ? (
                            <FiEyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <FiEye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="remember_me"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <Label className="text-sm font-normal text-muted-foreground">
                        {t("auth.login.rememberMe")}
                      </Label>
                    </FormItem>
                  )}
                />
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  {t("auth.login.forgotPassword")}
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? t("auth.login.loggingIn")
                  : t("auth.login.loginButton")}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.login.noAccount")}{" "}
            <Link to="/auth/register" className="text-primary hover:underline">
              {t("auth.login.register")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
