import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/stores/useNotificationStore";
import { useCurrentUser } from "@/stores/useUserStore";
import { useCreateClass } from "../hooks/useClass";

const formSchema = z.object({
  name: z
    .string()
    .min(1, "请输入班级名称")
    .max(100, "班级名称不能超过100个字符"),
  description: z.string().max(500, "班级描述不能超过500个字符").optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ClassCreatePage() {
  const navigate = useNavigate();
  const createClass = useCreateClass();
  const currentUser = useCurrentUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!currentUser) {
      notify.error("请先登录");
      return;
    }

    try {
      const newClass = await createClass.mutateAsync({
        name: values.name,
        description: values.description || null,
      });
      notify.success("班级创建成功", `邀请码: ${newClass.invite_code}`);
      navigate(`/user/classes/${newClass.id}`);
    } catch {
      notify.error("创建失败", "请稍后重试");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link to="/user/classes">
          <FiArrowLeft className="mr-2 h-4 w-4" />
          返回班级列表
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>创建班级</CardTitle>
          <CardDescription>
            创建一个新的班级，学生可以通过邀请码加入
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>班级名称</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="例如：数据结构 2026春季班"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      为班级起一个简洁明了的名称
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
                    <FormLabel>班级描述（可选）</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="添加班级描述，如课程内容、上课时间等"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/user/classes")}
                >
                  取消
                </Button>
                <Button type="submit" disabled={createClass.isPending}>
                  {createClass.isPending ? "创建中..." : "创建班级"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
