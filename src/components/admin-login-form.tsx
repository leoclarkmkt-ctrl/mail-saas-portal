"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminLoginSchema } from "@/lib/validation/schemas";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readJsonResponse } from "@/lib/utils/safe-json";

type AdminLoginValues = z.infer<typeof adminLoginSchema>;

type AdminLoginLabels = {
  email: string;
  password: string;
  submit: string;
  failed: string;
};

export function AdminLoginForm({ labels }: { labels: AdminLoginLabels }) {
  const [message, setMessage] = useState<string | null>(null);
  const params = useSearchParams();
  const lang = params.get("lang") ?? undefined;

  const form = useForm<AdminLoginValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: AdminLoginValues) => {
    setMessage(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const { data } = await readJsonResponse<{ error?: string }>(res);

    if (!res.ok) {
      setMessage(data?.error ?? labels.failed);
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
      </div>

      <div>
        <Label>{labels.password}</Label>
        <Input type="password" {...form.register("password")} />
      </div>

      <Button type="submit">{labels.submit}</Button>

      {message && <p className="text-sm text-rose-500">{message}</p>}
    </form>
  );
}
