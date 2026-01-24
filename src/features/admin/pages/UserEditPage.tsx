import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { useUpdateUser, useUser } from "../hooks/useUsers";
import type { UserRole, UserStatus } from "../services/userService";

const formSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址").optional().or(z.literal("")),
  password: z
    .string()
    .min(8, "密码至少8个字符")
    .regex(/[A-Z]/, "密码需包含大写字母")
    .regex(/[a-z]/, "密码需包含小写字母")
    .regex(/[0-9]/, "密码需包含数字")
    .optional()
    .or(z.literal("")),
  display_name: z.string().max(64, "显示名最多64个字符").optional(),
  role: z.enum(["user", "teacher", "admin"] as const),
  status: z.enum(["active", "suspended", "banned"] as const),
});

type FormValues = z.infer<typeof formSchema>;

export default function UserEditPage() {
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
    } catch {
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
              {error ? `加载失败: ${error.message}` : "用户不存在"}
            </p>
            <Button className="mt-4" onClick={() => navigate("/admin/users")}>
              返回用户列表
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
          <h1 className="text-2xl font-bold">编辑用户</h1>
          <p className="text-muted-foreground">
            编辑用户 <strong>{user.username}</strong> 的信息
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>用户信息</CardTitle>
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
                  用户名
                </label>
                <Input
                  id="username-display"
                  value={user.username}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">用户名不可修改</p>
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>邮箱</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="请输入邮箱" {...field} />
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
                    <FormLabel>新密码</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="留空则不修改密码"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      如需修改密码，请输入新密码（至少8个字符，需包含大小写字母和数字）
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
                    <FormLabel>显示名</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入显示名（可选）" {...field} />
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
                    <FormLabel>角色</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择用户角色" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">用户</SelectItem>
                        <SelectItem value="teacher">教师</SelectItem>
                        <SelectItem value="admin">管理员</SelectItem>
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
                    <FormLabel>状态</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择用户状态" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">正常</SelectItem>
                        <SelectItem value="suspended">暂停</SelectItem>
                        <SelectItem value="banned">封禁</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      暂停或封禁状态的用户将无法登录系统
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={updateUser.isPending}>
                  <FiSave className="mr-2 h-4 w-4" />
                  {updateUser.isPending ? "保存中..." : "保存修改"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/admin/users/${userId}`)}
                >
                  取消
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
