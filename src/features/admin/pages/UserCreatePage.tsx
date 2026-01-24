import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { useCreateUser } from "../hooks/useUsers";
import type { UserRole } from "../services/userService";

const formSchema = z.object({
  username: z
    .string()
    .min(5, "用户名至少5个字符")
    .max(16, "用户名最多16个字符")
    .regex(/^[A-Za-z0-9_-]+$/, "用户名只能包含字母、数字、下划线和连字符"),
  email: z.string().email("请输入有效的邮箱地址"),
  password: z
    .string()
    .min(8, "密码至少8个字符")
    .regex(/[A-Z]/, "密码需包含大写字母")
    .regex(/[a-z]/, "密码需包含小写字母")
    .regex(/[0-9]/, "密码需包含数字"),
  display_name: z.string().max(64, "显示名最多64个字符").optional(),
  role: z.enum(["user", "teacher", "admin"] as const),
});

type FormValues = z.infer<typeof formSchema>;

export default function UserCreatePage() {
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
    } catch {
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
          <h1 className="text-2xl font-bold">创建用户</h1>
          <p className="text-muted-foreground">添加一个新的系统用户</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>用户信息</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>用户名 *</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入用户名" {...field} />
                    </FormControl>
                    <FormDescription>
                      5-16个字符，只能包含字母、数字、下划线和连字符
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
                    <FormLabel>邮箱 *</FormLabel>
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
                    <FormLabel>密码 *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="请输入密码"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      至少8个字符，需包含大小写字母和数字
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
                    <FormDescription>用户在系统中显示的名称</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>角色 *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                    <FormDescription>
                      不同角色拥有不同的系统权限
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={createUser.isPending}>
                  <FiSave className="mr-2 h-4 w-4" />
                  {createUser.isPending ? "创建中..." : "创建用户"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/users")}
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
