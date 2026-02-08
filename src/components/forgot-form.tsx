"use client";

import { useEffect, useState, useId } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readJsonResponse } from "@/lib/utils/safe-json";

type ForgotValues = {
  personal_email: string;
};

type ForgotErrorResponse = {
  ok?: boolean;
  error?: { field?: string; key?: string; message?: string } | string;
};

export function ForgotForm({
  labels,
  errors,
  lang
}: {
  labels: Record<string, string>;
  errors: Record<string, string>;
  lang: "en" | "zh";
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const emailId = useId();
  const messageId = useId();
  const cooldownKey = `forgot_cooldown_until_${lang}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(cooldownKey);
    const until = raw ? Number(raw) : 0;
    if (!until || Number.isNaN(until)) return;
    const remaining = Math.max(0, Math.ceil((until - Date.now()) / 1000));
    if (remaining > 0) {
      setCooldown(remaining);
    } else {
      window.localStorage.removeItem(cooldownKey);
    }
  }, [cooldownKey]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          window.localStorage.removeItem(cooldownKey);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown, cooldownKey]);

  const form = useForm<ForgotValues>({
    defaultValues: { personal_email: "" },
  });

  const onSubmit = async (values: ForgotValues) => {
    setMessage(null);
    form.clearErrors();

    if (!values.personal_email) {
      form.setError("personal_email", {
        type: "manual",
        message: errors.forgot_email_required ?? errors.unknown ?? "Request failed"
      });
      return;
    }

    try {
      const res = await fetch("/api/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const { data } = await readJsonResponse<ForgotErrorResponse>(res);

      if (!res.ok) {
        const errorObj = typeof data?.error === "object" ? data?.error : undefined;
        if (errorObj?.field && errorObj?.key) {
          const msg = errors[errorObj.key] ?? errors.unknown ?? "Request failed";
          form.setError("personal_email", { type: "server", message: msg });
          return;
        }
        form.setError("personal_email", {
          type: "server",
          message: errors.unknown ?? "Request failed"
        });
        return;
      }

      if (!data?.ok) {
        form.setError("personal_email", {
          type: "server",
          message: errors.unknown ?? "Request failed"
        });
        return;
      }

      const until = Date.now() + 60_000;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(cooldownKey, String(until));
      }
      setCooldown(60);
      setMessage(labels.notice);
    } catch (error) {
      console.error("[forgot] request_failed", error);
      form.setError("personal_email", {
        type: "server",
        message: errors.unknown ?? "Request failed"
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor={emailId}>{labels.email}</Label>
        <Input
          id={emailId}
          type="email"
          aria-describedby={message ? messageId : undefined}
          {...form.register("personal_email")}
        />
        {form.formState.errors.personal_email?.message && (
          <p className="mt-1 text-xs text-rose-500">
            {form.formState.errors.personal_email.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={cooldown > 0}>
        {cooldown > 0 ? `已发送（${cooldown}s）` : labels.submit}
      </Button>

      {message && (
        <p className="text-sm text-slate-500" id={messageId}>
          {message}
        </p>
      )}
    </form>
  );
}
