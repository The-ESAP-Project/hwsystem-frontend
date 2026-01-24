import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FiCheckCircle } from "react-icons/fi";
import { Link } from "react-router";
import { z } from "zod/v4";

const forgotPasswordSchema = z.object({
  username: z
    .string()
    .min(1, "auth.forgotPassword.validation.usernameRequired"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      username: "",
    },
  });

  const onSubmit = async (_data: ForgotPasswordFormData) => {
    setIsLoading(true);
    // 模拟 API 调用
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md px-6 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
          <FiCheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("auth.forgotPassword.successTitle")}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {t("auth.forgotPassword.successMessage")}
        </p>
        <Link
          to="/auth/login"
          className="mt-6 inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          {t("auth.forgotPassword.loginLink")}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md px-6">
      <div className="text-center mb-8">
        <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center mb-4">
          <span className="text-white font-bold text-lg">HW</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("auth.forgotPassword.title")}
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {t("auth.forgotPassword.subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t("auth.forgotPassword.username")}
          </label>
          <input
            {...register("username")}
            type="text"
            id="username"
            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
            placeholder={t("auth.forgotPassword.usernamePlaceholder")}
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {t(errors.username.message!)}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          {isLoading
            ? t("auth.forgotPassword.processing")
            : t("auth.forgotPassword.submitButton")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        {t("auth.forgotPassword.backToLogin")}{" "}
        <Link
          to="/auth/login"
          className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          {t("auth.forgotPassword.loginLink")}
        </Link>
      </p>
    </div>
  );
}
