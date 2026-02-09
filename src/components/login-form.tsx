"use client";

import { useState, useId } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readJsonResponse } from "@/lib/utils/safe-json";

const modes = ["personal", "edu"] as const;

type LoginValues = {
  email: string;
  password: string;
};

type LoginFormProps = {
  labels: Record<string, string>;
  errors: Record<string, string>;
  lang: "en" | "zh";
};

type LoginErrorResponse = {
  ok?: boolean;
  error?: { field?: string; key?: string; message?: string } | string;
};

export function LoginForm({ labels, errors, lang }: LoginFormProps) {
  const [mode, setMode] = useState<(typeof modes)[number]>("personal");
  const emailId = useId();
  const passwordId = useId();

  const personalForm = useForm<LoginValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const eduForm = useForm<LoginValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const resolveErrorMessage = (key?: string) => {
    if (key === "login_edu_academic_year_not_registered") {
      return labels.eduAcademicYearNotRegistered ?? errors[key] ?? errors.unknown;
    }
    return errors[key ?? ""] ?? errors.request_failed ?? errors.unknown;
  };

  const handleSubmit = async (form: typeof personalForm, modeValue: (typeof modes)[number]) => {
    form.clearErrors();

    const values = form.getValues();

    if (!values.email) {
      form.setError("email", {
        type: "manual",
        message: resolveErrorMessage(
          modeValue === "personal" ? "login_personal_email_required" : "login_edu_email_required"
        ),
      });
      return;
    }

    if (!values.password) {
      form.setError("password", {
        type: "manual",
        message: resolveErrorMessage(
          modeValue === "personal"
            ? "login_personal_password_required"
            : "login_edu_password_required"
        ),
      });
      return;
    }

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, mode: modeValue }),
    });

    const { data } = await readJsonResponse<LoginErrorResponse>(res);

    if (!res.ok) {
      const errorObj = typeof data?.error === "object" ? data?.error : undefined;

      if (errorObj?.field && errorObj?.key) {
        const message = resolveErrorMessage(errorObj.key);

        if (errorObj.field === "email" || errorObj.field === "password") {
          form.setError(errorObj.field, { type: "server", message });
        } else {
          form.setError("email", { type: "server", message });
        }
        return;
      }

      form.setError("email", {
        type: "server",
        message: resolveErrorMessage("unknown"),
      });
      return;
    }

    // ✅ 登录成功：统一落到 dashboard（edu 登录后后端已创建 personal session，避免 dashboard 再跳回 /login）
    const resolvedLang = lang === "en" || lang === "zh" ? lang : undefined;
    const redirectPath = "/dashboard";

    window.location.href = resolvedLang ? `${redirectPath}?lang=${resolvedLang}` : redirectPath;
  };

  return (
    <div className="space-y-6">
      {/* 登录模式切换 */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant={mode === "personal" ? "default" : "outline"}
          onClick={() => setMode("personal")}
        >
          {labels.personalTab}
        </Button>
        <Button
          type="button"
          variant={mode === "edu" ? "default" : "outline"}
          onClick={() => setMode("edu")}
        >
          {labels.eduTab}
        </Button>
      </div>

      {/* 表单 */}
      {mode === "personal" && (
        <form
          onSubmit={personalForm.handleSubmit(() => handleSubmit(personalForm, "personal"))}
          className="space-y-4"
        >
          <div>
            <Label htmlFor={emailId}>{labels.email}</Label>
            <Input id={emailId} type="email" {...personalForm.register("email")} />
            {personalForm.formState.errors.email?.message && (
              <p className="mt-1 text-xs text-rose-500">
                {personalForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor={passwordId}>{labels.password}</Label>
            <Input id={passwordId} type="password" {...personalForm.register("password")} />
            {personalForm.formState.errors.password?.message && (
              <p className="mt-1 text-xs text-rose-500">
                {personalForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit">{labels.submit}</Button>
        </form>
      )}

      {mode === "edu" && (
        <form
          onSubmit={eduForm.handleSubmit(() => handleSubmit(eduForm, "edu"))}
          className="space-y-4"
        >
          <div>
            <Label htmlFor={emailId}>{labels.email}</Label>
            <Input id={emailId} type="email" {...eduForm.register("email")} />
            {eduForm.formState.errors.email?.message && (
              <p className="mt-1 text-xs text-rose-500">
                {eduForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor={passwordId}>{labels.password}</Label>
            <Input id={passwordId} type="password" {...eduForm.register("password")} />
            {eduForm.formState.errors.password?.message && (
              <p className="mt-1 text-xs text-rose-500">
                {eduForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit">{labels.submit}</Button>
        </form>
      )}
    </div>
  );
}
