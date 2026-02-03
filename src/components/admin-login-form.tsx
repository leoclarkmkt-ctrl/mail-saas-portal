"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminLoginSchema } from "@/lib/validation/schemas";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    defaultValues: { email: "", password: "" }
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("[submit] admin");
    setMessage(null);
    const isValid = await form.trigger();
    if (!isValid) return;
    const values = form.getValues();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? labels.failed);
      return;
    }
    const resolvedLang = lang === "en" || lang === "zh" ? lang : undefined;
    window.location.href = resolvedLang ? `/admin?lang=${resolvedLang}` : "/admin";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
