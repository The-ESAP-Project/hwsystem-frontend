import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { FiArrowLeft } from "react-icons/fi";
import { Link, useNavigate, useParams } from "react-router";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/stores/useNotificationStore";
import { useClass, useUpdateClass } from "../hooks/useClass";

const formSchema = z.object({
  name: z
    .string()
    .min(1, "请输入班级名称")
    .max(100, "班级名称不能超过100个字符"),
  description: z.string().max(500, "班级描述不能超过500个字符").optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ClassEditPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { data: classData, isLoading, error } = useClass(classId!);
  const updateClass = useUpdateClass(classId!);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (classData) {
      form.reset({
        name: classData.name,
        description: classData.description || "",
      });
    }
  }, [classData, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      await updateClass.mutateAsync({
        name: values.name,
        description: values.description || null,
      });
      notify.success("班级信息已更新");
      navigate(`/user/classes/${classId}`);
    } catch {
      notify.error("更新失败", "请稍后重试");
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-destructive">加载失败，请刷新重试</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-32 mb-4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link to={`/user/classes/${classId}`}>
          <FiArrowLeft className="mr-2 h-4 w-4" />
          返回班级详情
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>编辑班级</CardTitle>
          <CardDescription>修改班级名称和描述信息</CardDescription>
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
                  onClick={() => navigate(`/user/classes/${classId}`)}
                >
                  取消
                </Button>
                <Button type="submit" disabled={updateClass.isPending}>
                  {updateClass.isPending ? "保存中..." : "保存修改"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
