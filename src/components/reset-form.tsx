"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetSchema } from "@/lib/validation/schemas";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ResetValues = z.infer<typeof resetSchema>;

export function ResetForm({ labels }: { labels: Record<string, string> }) {
  const [message, setMessage] = useState<string | null>(null);
  const params = useSearchParams();
  const accessTokenFromQuery = params.get("access_token") ?? "";
  const [accessTokenFromHash, setAccessTokenFromHash] = useState("");

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

  const onSubmit = async (values: ResetValues) => {
    setMessage(null);
    const res = await fetch("/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Failed. Please check /status for configuration hints.");
      return;
    }
    setMessage("Success");
    window.location.href = "/login";
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>{labels.newPassword}</Label>
        <Input type="password" {...form.register("new_password")} />
      </div>
      <Button type="submit">{labels.submit}</Button>
      {message && <p className="text-sm text-slate-500">{message}</p>}
    </form>
  );
}
