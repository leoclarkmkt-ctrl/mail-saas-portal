"use client";

import { useState, useId } from "react";
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
  const emailId = useId();
  const messageId = useId();

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

    const res = await fetch("/api/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const { data } = await readJsonResponse<ForgotErrorResponse>(res);

    if (!res.ok) {
      const errorObj = typeof data?.error === "object" ? data?.error : undefined;
      if (errorObj?.field && errorObj?.key) {
        if (errorObj.key === "forgot_email_not_found") {
          setMessage(labels.notice);
          return;
        }
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

    setMessage(labels.notice);
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

      <Button type="submit">{labels.submit}</Button>

      {message && (
        <p className="text-sm text-slate-500" id={messageId}>
          {message}
        </p>
      )}
    </form>
  );
}
