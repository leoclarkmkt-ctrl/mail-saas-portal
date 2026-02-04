"use client";

import { useEffect, useState, useId } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetSchema } from "@/lib/validation/schemas";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readJsonResponse } from "@/lib/utils/safe-json";

type ResetValues = z.infer<typeof resetSchema>;

export function ResetForm({ labels }: { labels: Record<string, string> }) {
  const [message, setMessage] = useState<string | null>(null);
  const params = useSearchParams();
  const accessTokenFromQuery = params.get("access_token") ?? "";
  const [accessTokenFromHash, setAccessTokenFromHash] = useState("");
  const lang = params.get("lang") ?? undefined;
  const passwordId = useId();
  const messageId = useId();
  const tokenMessageId = useId();

  useEffect(() => {
    const hashToken = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("access_token") ?? "";
    setAccessTokenFromHash(hashToken);
  }, []);

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { access_token: accessTokenFromQuery || accessTokenFromHash, new_password: "" }
  });

  useEffect(() => {
    if (accessTokenFromQuery || accessTokenFromHash) {
      form.setValue("access_token", accessTokenFromQuery || accessTokenFromHash);
    }
  }, [accessTokenFromQuery, accessTokenFromHash, form]);

  const hasToken = Boolean(accessTokenFromQuery || accessTokenFromHash);
  const tokenMessage =
    lang === "zh"
      ? "重置链接无效或已过期，请重新发起找回流程。"
      : "Reset link is invalid or expired. Please request a new one.";

  const onSubmit = async (values: ResetValues) => {
    setMessage(null);
    const res = await fetch("/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const { data, text } = await readJsonResponse<{ error?: string }>(res);
    if (!res.ok) {
      setMessage(data?.error ?? text ?? "Failed. Please check /status for configuration hints.");
      return;
    }
    setMessage("Success");
    const resolvedLang = lang === "en" || lang === "zh" ? lang : undefined;
    window.location.href = resolvedLang ? `/login?lang=${resolvedLang}` : "/login";
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor={passwordId}>{labels.newPassword}</Label>
        <Input
          id={passwordId}
          type="password"
          aria-describedby={
            !hasToken ? tokenMessageId : message ? messageId : undefined
          }
          {...form.register("new_password")}
        />
      </div>
      <Button type="submit" disabled={!hasToken}>
        {labels.submit}
      </Button>
      {!hasToken && (
        <p className="text-sm text-rose-500" id={tokenMessageId}>
          {tokenMessage}
        </p>
      )}
      {message && (
        <p className="text-sm text-slate-500" id={messageId}>
          {message}
        </p>
      )}
    </form>
  );
}
