"use client";

import { useState, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotSchema } from "@/lib/validation/schemas";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readJsonResponse } from "@/lib/utils/safe-json";

type ForgotValues = z.infer<typeof forgotSchema>;

export function ForgotForm({
  labels,
  lang
}: {
  labels: Record<string, string>;
  lang: "en" | "zh";
}) {
  const [message, setMessage] = useState<string | null>(null);
  const emailId = useId();
  const messageId = useId();

  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { personal_email: "" },
  });

  const onSubmit = async (values: ForgotValues) => {
    setMessage(null);

    const res = await fetch("/api/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const { data } = await readJsonResponse<{ error?: string }>(res);

    if (!res.ok) {
      setMessage(data?.error ?? "Failed. Please check /status for configuration hints.");
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
