"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotSchema } from "@/lib/validation/schemas";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ForgotValues = z.infer<typeof forgotSchema>;

export function ForgotForm({ labels }: { labels: Record<string, string> }) {
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { personal_email: "" }
  });

  const onSubmit = async (values: ForgotValues) => {
    setMessage(null);
    const res = await fetch("/api/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Failed. Please check /status for configuration hints.");
      return;
    }
    setMessage(labels.notice);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>{labels.email}</Label>
        <Input type="email" {...form.register("personal_email")} />
      </div>
      <Button type="submit">{labels.submit}</Button>
      {message && <p className="text-sm text-slate-500">{message}</p>}
    </form>
  );
}
