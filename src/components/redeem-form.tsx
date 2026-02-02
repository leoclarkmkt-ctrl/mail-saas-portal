"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { redeemSchema } from "@/lib/validation/schemas";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RedeemValues = z.infer<typeof redeemSchema>;

type RedeemResult = {
  personal_email: string;
  edu_email: string;
  expires_at: string;
  password: string;
  webmail: string;
};

export function RedeemForm({ labels }: { labels: Record<string, string> }) {
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const params = useSearchParams();
  const lang = params.get("lang") ?? undefined;
  const form = useForm<RedeemValues>({
    resolver: zodResolver(redeemSchema),
    defaultValues: {
      activation_code: "",
      personal_email: "",
      edu_username: "",
      password: ""
    }
  });

  const onSubmit = async (values: RedeemValues) => {
    setMessage(null);
    const res = await fetch("/api/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Failed. Please check /status for configuration hints.");
      return;
    }
    setResult(data);
  };

  const copyInfo = async () => {
    if (!result) return;
    const text = `${labels.eduEmail}: ${result.edu_email}\n${labels.password}: ${result.password}\n${labels.webmail}: ${result.webmail}`;
    await navigator.clipboard.writeText(text);
    setMessage(labels.copied);
  };

  if (result) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {labels.successTitle}
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <p>{labels.personalEmail}: {result.personal_email}</p>
          <p>{labels.eduEmail}: {result.edu_email}</p>
          <p>{labels.expiresAt}: {result.expires_at}</p>
          <p>{labels.webmail}: {result.webmail}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={copyInfo}>{labels.copyInfo}</Button>
          <Button
            variant="outline"
            onClick={() => {
              const resolvedLang = lang === "en" || lang === "zh" ? lang : undefined;
              window.location.href = resolvedLang ? `/dashboard?lang=${resolvedLang}` : "/dashboard";
            }}
          >
            {labels.dashboard}
          </Button>
        </div>
        {message && <p className="text-sm text-slate-500">{message}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>{labels.activationCode}</Label>
        <Input placeholder={labels.activationCodePlaceholder} {...form.register("activation_code")} />
      </div>
      <div>
        <Label>{labels.personalEmail}</Label>
        <Input type="email" {...form.register("personal_email")} />
        <p className="mt-1 text-xs text-slate-500">{labels.personalEmailHelp}</p>
      </div>
      <div>
        <Label>{labels.eduUsername}</Label>
        <Input {...form.register("edu_username")} />
        <p className="mt-1 text-xs text-slate-500">{labels.eduUsernameHelp}</p>
      </div>
      <div>
        <Label>{labels.password}</Label>
        <Input type="password" {...form.register("password")} />
        <p className="mt-1 text-xs text-slate-500">{labels.passwordHelp}</p>
      </div>
      <Button type="submit">{labels.submit}</Button>
      {message && <p className="text-sm text-rose-500">{message}</p>}
    </form>
  );
}
