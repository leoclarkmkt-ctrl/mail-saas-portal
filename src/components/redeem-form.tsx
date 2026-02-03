"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { redeemSchema } from "@/lib/validation/schemas";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RedeemCopy, RedeemMessageKey, RedeemStatusKey } from "@/lib/redeem-copy";

type RedeemValues = z.infer<typeof redeemSchema>;

type RedeemResult = {
  personal_email: string;
  edu_email: string;
  expires_at: string;
  password: string;
  webmail: string;
};

type RedeemFormProps = {
  copy: RedeemCopy;
  lang: "en" | "zh";
};

type RedeemErrorKey =
  | "required_activation_code"
  | "required_personal_email"
  | "required_username"
  | "invalid_username"
  | "required_password"
  | "invalid_email"
  | "invalid_password_rules";

export function RedeemForm({ copy, lang }: RedeemFormProps) {
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [messageKey, setMessageKey] = useState<RedeemMessageKey | null>(null);
  const [messageDetail, setMessageDetail] = useState<string | null>(null);
  const [status, setStatus] = useState<RedeemStatusKey>("idle");
  const [submitting, setSubmitting] = useState(false);
  const params = useSearchParams();
  const runtimeLang = params.get("lang") === "zh" ? "zh" : params.get("lang") === "en" ? "en" : lang;
  const form = useForm<RedeemValues>({
    resolver: zodResolver(redeemSchema),
    defaultValues: {
      activation_code: "",
      personal_email: "",
      edu_username: "",
      password: ""
    }
  });

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

  const setFieldError = (field: keyof RedeemValues, key: RedeemErrorKey) => {
    form.setError(field, { type: "manual", message: key });
  };

  const validateValues = (values: RedeemValues) => {
    let valid = true;
    form.clearErrors();
    if (!String(values.activation_code ?? "").trim()) {
      setFieldError("activation_code", "required_activation_code");
      valid = false;
    }
    if (!String(values.personal_email ?? "").trim()) {
      setFieldError("personal_email", "required_personal_email");
      valid = false;
    } else {
      const emailOk = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(values.personal_email);
      if (!emailOk) {
        setFieldError("personal_email", "invalid_email");
        valid = false;
      }
    }
    if (!String(values.edu_username ?? "").trim()) {
      setFieldError("edu_username", "required_username");
      valid = false;
    }
    if (!String(values.password ?? "").trim()) {
      setFieldError("password", "required_password");
      valid = false;
    } else {
      const passwordOk =
        values.password.length >= 8 &&
        /[A-Z]/.test(values.password) &&
        /[a-z]/.test(values.password) &&
        /\\d/.test(values.password) &&
        /[^A-Za-z0-9]/.test(values.password);
      if (!passwordOk) {
        setFieldError("password", "invalid_password_rules");
        valid = false;
      }
    }
    return valid;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessageKey("verifying");
    setMessageDetail(null);
    setStatus("validating");
    setSubmitting(true);
    try {
      const values = form.getValues();
      const valid = validateValues(values);
      if (!valid) {
        setStatus("error");
        setMessageKey("submit_failed_generic");
        return;
      }
      const healthController = new AbortController();
      const healthTimeout = setTimeout(() => healthController.abort(), 10000);
      try {
        const healthRes = await fetch("/api/health", { signal: healthController.signal });
        const healthRaw = await healthRes.text();
        let healthParsed: Record<string, unknown> | null = null;
        if (healthRaw) {
          try {
            const candidate = JSON.parse(healthRaw);
            if (isRecord(candidate)) {
              healthParsed = candidate;
            }
          } catch {
            healthParsed = null;
          }
        }
        const healthOk = Boolean(healthParsed?.ok);
        const supabaseInfo = isRecord(healthParsed?.supabase) ? healthParsed?.supabase : null;
        const dbOk = Boolean(supabaseInfo && isRecord(supabaseInfo) && supabaseInfo.dbOk === true);
        const authOk = Boolean(supabaseInfo && isRecord(supabaseInfo) && supabaseInfo.authOk === true);
        console.debug("Redeem health check", { ok: healthOk, dbOk, authOk });
        if (!healthParsed) {
          setStatus("error");
          setMessageKey("serverReturnedNonJson");
          return;
        }
        if (!healthOk || !dbOk) {
          setStatus("error");
          setMessageKey("healthDbUnavailable");
          setMessageDetail(copy.messages.healthDbUnavailableHint);
          return;
        }
      } catch (error) {
        setStatus("error");
        if (error instanceof Error && error.name === "AbortError") {
          setMessageKey("requestTimeout");
        } else {
          setMessageKey("healthCheckFailed");
        }
        return;
      } finally {
        clearTimeout(healthTimeout);
      }

      setStatus("submitting");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      const payload = {
        activation_code: values.activation_code,
        personal_email: values.personal_email,
        edu_username: values.edu_username,
        password: values.password
      };
      const debugPayload = { ...payload, password: "***" };
      console.debug("Redeem submit payload", debugPayload);
      try {
        const res = await fetch("/api/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        const raw = await res.text();
        console.debug("Redeem response status", res.status);
        console.debug("Redeem response raw", raw.slice(0, 300));
        let parsed: Record<string, unknown> | null = null;
        if (raw) {
          try {
            const candidate = JSON.parse(raw);
            if (isRecord(candidate)) {
              parsed = candidate;
            }
          } catch {
            parsed = null;
          }
        }
        if (!res.ok) {
          const errorMessage =
            typeof parsed?.error === "string"
              ? parsed.error
              : typeof parsed?.message === "string"
              ? parsed.message
              : raw.slice(0, 300);
          setStatus("error");
          setMessageKey("serverErrorPrefix");
          const detail =
            runtimeLang === "zh" ? copy.submitFailedGeneric : errorMessage || copy.submitFailedGeneric;
          setMessageDetail(detail);
          return;
        }
        if (!parsed) {
          setStatus("error");
          setMessageKey("serverReturnedNonJson");
          setMessageDetail(raw.slice(0, 300));
          return;
        }
        if (
          typeof parsed.personal_email !== "string" ||
          typeof parsed.edu_email !== "string" ||
          typeof parsed.expires_at !== "string" ||
          typeof parsed.password !== "string" ||
          typeof parsed.webmail !== "string"
        ) {
          setStatus("error");
          setMessageKey("serverReturnedNonJson");
          setMessageDetail(raw.slice(0, 300));
          return;
        }
        setResult({
          personal_email: parsed.personal_email,
          edu_email: parsed.edu_email,
          expires_at: parsed.expires_at,
          password: parsed.password,
          webmail: parsed.webmail
        });
        setStatus("success");
      } catch (error) {
        setStatus("error");
      } finally {
        clearTimeout(timeoutId);
      }
    } catch {
      setStatus("error");
      setMessageKey("submit_failed_generic");
      setMessageDetail(null);
      return;
    } finally {
      setSubmitting(false);
    }
  };

  const copyInfo = async () => {
    if (!result) return;

    // 统一只生成一份可复制信息（避免重复 const 声明导致编译失败）
    const clipboardText =
      `${copy.fields.personalEmail}: ${result.personal_email}\n` +
      `${copy.eduEmail}: ${result.edu_email}\n` +
      `${copy.fields.password}: ${result.password}\n` +
      `${copy.webmail}: ${result.webmail}\n` +
      `${copy.expiresAt}: ${result.expires_at}`;

    await navigator.clipboard.writeText(clipboardText);

    // 清理消息提示（这里不要 setServerError，因为此版本没有 serverError state）
    setMessageKey(null);
    setMessageDetail(null);
  };


  if (result) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {copy.successTitle}
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <p>{copy.fields.personalEmail}: {result.personal_email}</p>
          <p>{copy.eduEmail}: {result.edu_email}</p>
          <p>{copy.expiresAt}: {result.expires_at}</p>
          <p>{copy.webmail}: {result.webmail}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={copyInfo}>{copy.copyInfo}</Button>
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = `/dashboard?lang=${runtimeLang}`;
            }}
          >
            {copy.dashboard}
          </Button>
        </div>
        {messageKey && (
          <p className="text-sm text-slate-500">
            {messageKey === "serverErrorPrefix"
              ? `${copy.serverErrorPrefix}${messageDetail ?? ""}`
              : copy.messages[messageKey]}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label>{copy.fields.activationCode}</Label>
        <Input placeholder={copy.fields.activationCodePlaceholder} {...form.register("activation_code")} />
        <p className="mt-1 text-xs text-slate-500">{copy.fields.activationCodeHelp}</p>
        {form.formState.errors.activation_code?.message && (
          <p className="mt-1 text-xs text-rose-500">
            {copy.messages[form.formState.errors.activation_code.message as RedeemErrorKey]}
          </p>
        )}
      </div>
      <div>
        <Label>{copy.fields.personalEmail}</Label>
        <Input type="email" {...form.register("personal_email")} />
        <p className="mt-1 text-xs text-slate-500">{copy.fields.personalEmailHelp}</p>
        {form.formState.errors.personal_email?.message && (
          <p className="mt-1 text-xs text-rose-500">
            {copy.messages[form.formState.errors.personal_email.message as RedeemErrorKey]}
          </p>
        )}
      </div>
      <div>
        <Label>{copy.fields.eduUsername}</Label>
        <Input {...form.register("edu_username")} />
        <p className="mt-1 text-xs text-slate-500">{copy.fields.eduUsernameHelp}</p>
        {form.formState.errors.edu_username?.message && (
          <p className="mt-1 text-xs text-rose-500">
            {copy.messages[form.formState.errors.edu_username.message as RedeemErrorKey]}
          </p>
        )}
      </div>
      <div>
        <Label>{copy.fields.password}</Label>
        <Input type="password" {...form.register("password")} />
        <p className="mt-1 text-xs text-slate-500">{copy.fields.passwordHelp}</p>
        {form.formState.errors.password?.message && (
          <p className="mt-1 text-xs text-rose-500">
            {copy.messages[form.formState.errors.password.message as RedeemErrorKey]}
          </p>
        )}
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? copy.messages.verifying : copy.buttons.submit}
      </Button>
      {(messageKey || status === "idle") && messageKey !== "verifying" && (
        <p className="text-sm text-rose-500">
          {messageKey
            ? messageKey === "serverErrorPrefix"
              ? `${copy.serverErrorPrefix}${messageDetail ?? ""}`
              : `${copy.messages[messageKey]}${messageDetail ? ` ${messageDetail}` : ""}`
            : copy.status.idle}
        </p>
      )}
    </form>
  );
}
