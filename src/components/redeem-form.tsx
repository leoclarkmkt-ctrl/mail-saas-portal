"use client";

import { useState } from "react";
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
      setMessage(data.error ?? "Failed");
      return;
    }
    setResult(data);
  };

  const copyInfo = async () => {
    if (!result) return;
    const text = `Edu Email: ${result.edu_email}\nPassword: ${result.password}\nWebmail: ${result.webmail}`;
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
          <p>Edu Email: {result.edu_email}</p>
          <p>{labels.expiresAt}: {result.expires_at}</p>
          <p>{labels.webmail}: {result.webmail}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={copyInfo}>{labels.copyInfo}</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
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
        <Input {...form.register("activation_code")} />
      </div>
      <div>
        <Label>{labels.personalEmail}</Label>
        <Input type="email" {...form.register("personal_email")} />
      </div>
      <div>
        <Label>{labels.eduUsername}</Label>
        <Input {...form.register("edu_username")} />
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
