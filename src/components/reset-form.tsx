"use client";

import { useEffect, useMemo, useState, useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { passwordSchema } from "@/lib/validation/schemas";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const resetClientSchema = z.object({
  new_password: passwordSchema
});

type ResetValues = z.infer<typeof resetClientSchema>;
type SessionState = "loading" | "ready" | "invalid";

function cleanupResetUrl() {
  const current = new URL(window.location.href);
  const preservedLang = current.searchParams.get("lang");
  const cleanSearch = preservedLang ? `?lang=${encodeURIComponent(preservedLang)}` : "";
  const cleanUrl = `${current.pathname}${cleanSearch}`;
  window.history.replaceState({}, document.title, cleanUrl);
}

export function ResetForm({
  labels,
  lang
}: {
  labels: {
    newPassword: string;
    submit: string;
    loading: string;
    invalidLink: string;
    expiredLink: string;
    sessionMissing: string;
    submitFailed: string;
    submitSuccess: string;
  };
  lang: "en" | "zh";
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>("loading");
  const passwordId = useId();
  const messageId = useId();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetClientSchema),
    defaultValues: { new_password: "" }
  });

  useEffect(() => {
    const establishRecoverySession = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setSessionState("invalid");
          setMessage(labels.expiredLink);
          return;
        }
        cleanupResetUrl();
        setSessionState("ready");
        return;
      }

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      if (accessToken && refreshToken && type === "recovery") {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        if (error) {
          setSessionState("invalid");
          setMessage(labels.expiredLink);
          return;
        }
        cleanupResetUrl();
        setSessionState("ready");
        return;
      }

      setSessionState("invalid");
      setMessage(labels.invalidLink);
    };

    void establishRecoverySession();
  }, [labels.expiredLink, labels.invalidLink, supabase]);

  const onSubmit = async (values: ResetValues) => {
    setMessage(null);
    if (sessionState !== "ready") {
      setMessage(labels.sessionMissing);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: values.new_password
    });

    if (error) {
      const isMissingSession = /auth session missing/i.test(error.message ?? "");
      setMessage(isMissingSession ? labels.sessionMissing : labels.submitFailed);
      return;
    }

    setMessage(labels.submitSuccess);
    const resolvedLang = lang === "en" || lang === "zh" ? lang : undefined;
    window.location.href = resolvedLang ? `/login?lang=${resolvedLang}` : "/login";
  };

  const disabled = sessionState !== "ready" || form.formState.isSubmitting;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor={passwordId}>{labels.newPassword}</Label>
        <Input id={passwordId} type="password" aria-describedby={message ? messageId : undefined} {...form.register("new_password")} />
      </div>
      <Button type="submit" disabled={disabled}>{labels.submit}</Button>
      {sessionState === "loading" && <p className="text-sm text-slate-500">{labels.loading}</p>}
      {message && (
        <p className="text-sm text-slate-500" id={messageId}>
          {message}
        </p>
      )}
    </form>
  );
}
