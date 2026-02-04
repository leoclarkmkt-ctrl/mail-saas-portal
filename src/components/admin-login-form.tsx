"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readJsonResponse } from "@/lib/utils/safe-json";

type AdminLoginValues = {
  email: string;
  password: string;
};

type AdminLoginLabels = {
  email: string;
  password: string;
  submit: string;
  failed: string;
};

type AdminLoginProps = {
  labels: AdminLoginLabels;
  errors: Record<string, string>;
  lang: "en" | "zh";
};

type AdminLoginErrorResponse = {
  ok?: boolean;
  error?: { field?: string; key?: string; message?: string } | string;
};

export function AdminLoginForm({ labels, errors, lang }: AdminLoginProps) {
  const form = useForm<AdminLoginValues>({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: AdminLoginValues) => {
    form.clearErrors();
    if (!values.email) {
      form.setError("email", {
        type: "manual",
        message: errors.admin_email_invalid ?? errors.unknown ?? labels.failed
      });
      return;
    }
    if (!values.password) {
      form.setError("password", {
        type: "manual",
        message: errors.admin_password_invalid ?? errors.unknown ?? labels.failed
      });
      return;
    }

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const { data } = await readJsonResponse<AdminLoginErrorResponse>(res);

    if (!res.ok) {
      const errorObj = typeof data?.error === "object" ? data?.error : undefined;
      if (errorObj?.field && errorObj?.key) {
        const msg = errors[errorObj.key] ?? errors.unknown ?? labels.failed;
        if (errorObj.field === "email" || errorObj.field === "password") {
          form.setError(errorObj.field, { type: "server", message: msg });
        } else {
          form.setError("email", { type: "server", message: msg });
        }
        return;
      }
      form.setError("email", {
        type: "server",
        message: errors.unknown ?? labels.failed
      });
      return;
    }

    const resolvedLang = lang === "en" || lang === "zh" ? lang : undefined;
    window.location.href = resolvedLang ? `/admin?lang=${resolvedLang}` : "/admin";
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>{labels.email}</Label>
        <Input type="email" {...form.register("email")} />
        {form.formState.errors.email?.message && (
          <p className="mt-1 text-xs text-rose-500">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div>
        <Label>{labels.password}</Label>
        <Input type="password" {...form.register("password")} />
        {form.formState.errors.password?.message && (
          <p className="mt-1 text-xs text-rose-500">{form.formState.errors.password.message}</p>
        )}
      </div>

      <Button type="submit">{labels.submit}</Button>
    </form>
  );
}
