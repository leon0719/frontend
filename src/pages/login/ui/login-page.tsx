// src/pages/login/ui/login-page.tsx
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useAuth } from "@/shared/auth";
import { useZodForm } from "@/shared/lib/form";
import { Button, Input } from "@/shared/ui";

const schema = z.object({
  username: z.string().min(1, "請輸入帳號"),
  password: z.string().min(1, "請輸入密碼"),
});

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm(schema, { defaultValues: { username: "", password: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values);
      navigate({ to: "/" });
    } catch {
      setFormError("帳號或密碼錯誤");
    }
  });

  return (
    <div className="mx-auto max-w-sm p-8">
      <h1 className="mb-6 text-lg font-medium">登入</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1 text-sm">
          帳號
          <Input {...register("username")} />
          {errors.username && <span className="text-destructive">{errors.username.message}</span>}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          密碼
          <Input type="password" {...register("password")} />
          {errors.password && <span className="text-destructive">{errors.password.message}</span>}
        </label>
        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <Button type="submit" disabled={isSubmitting}>
          登入
        </Button>
      </form>
    </div>
  );
}
