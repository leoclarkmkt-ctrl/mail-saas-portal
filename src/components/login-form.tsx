"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validation/schemas";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const modes = ["personal", "edu"] as const;

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm({ labels }: { labels: Record<string, string> }) {
  const [mode, setMode] = useState<(typeof modes)[number]>("personal");
  const [message, setMessage] = useState<string | null>(null);
  const params = useSearchParams();
  const lang = params.get("lang") ?? undefined;

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", mode }
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("[submit] login");
    setMessage(null);
    const isValid = await form.trigger();
    if (!isValid) return;
    const values = form.getValues();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, mode })
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Login failed. Please check /status for configuration hints.");
      return;
    }
    const resolvedLang = lang === "en" || lang === "zh" ? lang : undefined;
    window.location.href = resolvedLang ? `/dashboard?lang=${resolvedLang}` : "/dashboard";
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <Button variant={mode === "personal" ? "default" : "outline"} onClick={() => setMode("personal")}>
          {labels.personalTab}
        </Button>
        <Button variant={mode === "edu" ? "default" : "outline"} onClick={() => setMode("edu")}>
          {labels.eduTab}
        </Button>
      </div>
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
    </div>
  );
}
