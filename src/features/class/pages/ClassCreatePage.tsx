import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FiArrowLeft } from "react-icons/fi";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUserList } from "@/features/admin/hooks/useUsers";
import { usePermission } from "@/features/auth/hooks/usePermission";
import { logger } from "@/lib/logger";
import { notify } from "@/stores/useNotificationStore";
import { useCurrentUser } from "@/stores/useUserStore";
import { useCreateClass } from "../hooks/useClass";
import { useRoutePrefix } from "../hooks/useClassBasePath";

function useFormSchema(isAdmin: boolean) {
  const { t } = useTranslation();
  return useMemo(
    () =>
      z.object({
        name: z
          .string()
          .min(1, t("classEditPage.validation.nameRequired"))
          .max(100, t("classEditPage.validation.nameMaxLength")),
        description: z
          .string()
          .max(500, t("classEditPage.validation.descriptionMaxLength"))
          .optional(),
        teacher_id: isAdmin
          ? z.string().min(1, t("classEditPage.validation.teacherRequired"))
          : z.string().optional(),
      }),
    [t, isAdmin],
  );
}

type FormValues = z.infer<ReturnType<typeof useFormSchema>>;

export function ClassCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const createClass = useCreateClass();
  const currentUser = useCurrentUser();
  const { isAdmin } = usePermission();
  const formSchema = useFormSchema(isAdmin);

  // 获取教师列表（仅管理员需要）
  const { data: teachersData } = useUserList({
    role: "teacher",
    page_size: 100,
  });
  const teachers = teachersData?.items ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      teacher_id: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!currentUser) {
      notify.error(t("notify.auth.loginRequired"));
      return;
    }

    try {
      const newClass = await createClass.mutateAsync({
        name: values.name,
        description: values.description || null,
        teacher_id: isAdmin && values.teacher_id ? values.teacher_id : null,
      });
      notify.success(
        t("notify.class.createSuccess"),
        `邀请码: ${newClass.invite_code}`,
      );
      navigate(`${prefix}/classes/${newClass.id}`);
    } catch (error) {
      logger.error("Failed to create class", error);
      notify.error(t("notify.class.createFailed"), t("notify.tryAgainLater"));
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link to={`${prefix}/classes`}>
          <FiArrowLeft className="mr-2 h-4 w-4" />
          {t("classPage.backToList")}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{t("classCreatePage.title")}</CardTitle>
          <CardDescription>{t("classCreatePage.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("classEditPage.fields.name")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("classEditPage.fields.namePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("classEditPage.fields.nameDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("classEditPage.fields.descriptionLabel")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t(
                          "classEditPage.fields.descriptionPlaceholder",
                        )}
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isAdmin && (
                <FormField
                  control={form.control}
                  name="teacher_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("classEditPage.fields.teacher")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t(
                                "classEditPage.fields.teacherPlaceholder",
                              )}
                            >
                              {field.value &&
                                (() => {
                                  const selectedTeacher = teachers.find(
                                    (t) => String(t.id) === String(field.value),
                                  );
                                  return (
                                    selectedTeacher?.display_name ||
                                    selectedTeacher?.username ||
                                    ""
                                  );
                                })()}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem
                              key={teacher.id}
                              value={String(teacher.id)}
                            >
                              {teacher.display_name ||
                                teacher.username ||
                                teacher.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t("classEditPage.fields.teacherDescription")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`${prefix}/classes`)}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={createClass.isPending}>
                  {createClass.isPending
                    ? t("common.creating")
                    : t("classCreatePage.createClass")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
