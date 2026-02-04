"use client";

import { useState, useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validation/schemas";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readJsonResponse } from "@/lib/utils/safe-json";

const modes = ["personal", "edu"] as const;

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm({ labels, lang }: { labels: Record<string, string>; lang: "en" | "zh" }) {
  const [mode, setMode] = useState<(typeof modes)[number]>("personal");
  const [message, setMessage] = useState<string | null>(null);
  const emailId = useId();
  const passwordId = useId();
  const messageId = useId();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      mode: "personal",
    },
  });

  /** 当 tab 切换时，同步到表单里 */
  useEffect(() => {
    form.setValue("mode", mode);
  }, [mode, form]);

  const onSubmit = async (values: LoginValues) => {
    setMessage(null);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const { data } = await readJsonResponse<{ error?: string }>(res);

    if (!res.ok) {
      setMessage(data?.error ?? "Login failed. Please check /status for configuration hints.");
      return;
    }

    const resolvedLang = lang === "en" || lang === "zh" ? lang : undefined;
    window.location.href = resolvedLang
      ? `/dashboard?lang=${resolvedLang}`
      : "/dashboard";
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor={emailId}>{labels.email}</Label>
          <Input
            id={emailId}
            type="email"
            aria-describedby={message ? messageId : undefined}
            {...form.register("email")}
          />
        </div>

        <div>
          <Label htmlFor={passwordId}>{labels.password}</Label>
          <Input
            id={passwordId}
            type="password"
            aria-describedby={message ? messageId : undefined}
            {...form.register("password")}
          />
        </div>

        <Button type="submit">{labels.submit}</Button>

        {message && (
          <p className="text-sm text-rose-500" id={messageId}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
