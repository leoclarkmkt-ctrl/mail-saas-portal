"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RedeemCopy, RedeemMessageKey, RedeemStatusKey } from "@/lib/redeem-copy";

type RedeemValues = {
  activation_code: string;
  personal_email: string;
  edu_username: string;
  password: string;
};

type RedeemResult = {
  personal_email: string;
  edu_email: string;
  expires_at: string;
  password: string;
  webmail: string;
};

type RedeemFormProps = {
  copy: RedeemCopy;
  errors: Record<string, string>;
  lang: "en" | "zh";
};

export function RedeemForm({ copy, errors, lang }: RedeemFormProps) {
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [messageKey, setMessageKey] = useState<RedeemMessageKey | null>(null);
  const [messageDetail, setMessageDetail] = useState<string | null>(null);
  const [status, setStatus] = useState<RedeemStatusKey>("idle");
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<RedeemValues>({
    defaultValues: {
      activation_code: "",
      personal_email: "",
      edu_username: "",
      password: "",
    },
  });

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

  const resolveErrorMessage = (key?: string) =>
    errors[key ?? ""] ?? errors.unknown ?? "Request failed";

  const setFieldError = (field: keyof RedeemValues, key: string) => {
    form.setError(field, { type: "manual", message: resolveErrorMessage(key) });
  };

  /** 手动补一层“更友好”的错误提示（不依赖 schema 文案） */
  const validateValues = (values: RedeemValues) => {
    let valid = true;
    form.clearErrors();

    const activation = String(values.activation_code ?? "").trim();
    const personal = String(values.personal_email ?? "").trim();
    const edu = String(values.edu_username ?? "").trim();
    const pass = String(values.password ?? "").trim();

    if (!activation) {
      setFieldError("activation_code", "activation_code_required");
      valid = false;
    }

    if (!personal) {
      setFieldError("personal_email", "personal_email_required");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal)) {
      setFieldError("personal_email", "personal_email_invalid");
      valid = false;
    }

    if (!edu) {
      setFieldError("edu_username", "edu_username_required");
      valid = false;
    } else if (!/^[a-zA-Z0-9._-]{3,32}$/.test(edu)) {
      setFieldError("edu_username", "edu_username_invalid");
      valid = false;
    }

    if (!pass) {
      setFieldError("password", "password_required");
      valid = false;
    } else {
      const passwordOk =
        pass.length >= 8 &&
        /[A-Z]/.test(pass) &&
        /[a-z]/.test(pass) &&
        /\d/.test(pass) &&
        /[^A-Za-z0-9]/.test(pass);
      if (!passwordOk) {
        setFieldError("password", "password_invalid");
        valid = false;
      }
    }

    return {
      valid,
      values: {
        activation_code: activation,
        personal_email: personal,
        edu_username: edu,
        password: pass,
      },
    };
  };

  const onSubmit = async (values: RedeemValues) => {
    setMessageKey("verifying");
    setMessageDetail(null);
    setStatus("validating");
    setSubmitting(true);

    try {
      const validated = validateValues(values);
      if (!validated.valid) {
        setStatus("error");
        setMessageKey(null);
        setMessageDetail(null);
        return;
      }

      // 1) 先做健康检查，避免用户一直提交但后端没配置好
      const healthController = new AbortController();
      const healthTimeout = setTimeout(() => healthController.abort(), 10000);

      try {
        const healthRes = await fetch("/api/health", { signal: healthController.signal });
        const healthRaw = await healthRes.text();

        let healthParsed: Record<string, unknown> | null = null;
        if (healthRaw) {
          try {
            const candidate = JSON.parse(healthRaw);
            if (isRecord(candidate)) healthParsed = candidate;
          } catch {
            healthParsed = null;
          }
        }

        const healthOk = Boolean(healthParsed?.ok);
        const supabaseInfo = isRecord(healthParsed?.supabase) ? (healthParsed?.supabase as any) : null;
        const dbOk = Boolean(supabaseInfo && supabaseInfo.dbOk === true);

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

      // 2) 正式提交
      setStatus("submitting");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const payload = validated.values;
      const debugPayload = { ...payload, password: "***" };
      console.debug("Redeem submit payload", debugPayload);

      try {
        const res = await fetch("/api/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        const raw = await res.text();
        let parsed: Record<string, unknown> | null = null;

        if (raw) {
          try {
            const candidate = JSON.parse(raw);
            if (isRecord(candidate)) parsed = candidate;
          } catch {
            parsed = null;
          }
        }

        if (!res.ok) {
          const errorField =
            typeof parsed?.error === "object" && parsed?.error
              ? (parsed.error as { field?: string }).field
              : undefined;
          const errorKey =
            typeof parsed?.error === "object" && parsed?.error
              ? (parsed.error as { key?: string }).key
              : undefined;
          if (errorField && errorKey) {
            form.setError(errorField as keyof RedeemValues, {
              type: "server",
              message: resolveErrorMessage(errorKey),
            });
            setStatus("error");
            setMessageKey(null);
            setMessageDetail(null);
            return;
          }

          const errorMessage =
            typeof parsed?.error === "string"
              ? (parsed.error as string)
              : typeof parsed?.message === "string"
              ? (parsed.message as string)
              : raw.slice(0, 300);

          setStatus("error");
          setMessageKey("serverErrorPrefix");

          const detail =
            lang === "zh" ? copy.submitFailedGeneric : errorMessage || copy.submitFailedGeneric;
          setMessageDetail(detail);

          return;
        }

        if (
          !parsed ||
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
          webmail: parsed.webmail,
        });

        setStatus("success");
        setMessageKey(null);
        setMessageDetail(null);
      } catch (error) {
        setStatus("error");
        if (error instanceof Error && error.name === "AbortError") {
          setMessageKey("requestTimeout");
        } else {
          setMessageKey("submit_failed_generic");
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch {
      setStatus("error");
      setMessageKey("submit_failed_generic");
      setMessageDetail(null);
    } finally {
      setSubmitting(false);
    }
  };

  const copyInfo = async () => {
    if (!result) return;

    // ✅ 只保留一个变量，避免 duplicate const text
    const clipboardText =
      `${copy.fields.personalEmail}: ${result.personal_email}\n` +
      `${copy.eduEmail}: ${result.edu_email}\n` +
      `${copy.fields.password}: ${result.password}\n` +
      `${copy.webmail}: ${result.webmail}\n` +
      `${copy.expiresAt}: ${result.expires_at}`;

    await navigator.clipboard.writeText(clipboardText);
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
          <p>
            {copy.fields.personalEmail}: {result.personal_email}
          </p>
          <p>
            {copy.eduEmail}: {result.edu_email}
          </p>
          <p>
            {copy.expiresAt}: {result.expires_at}
          </p>
          <p>
            {copy.webmail}: {result.webmail}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={copyInfo}>{copy.copyInfo}</Button>
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = `/dashboard?lang=${lang}`;
            }}
          >
            {copy.dashboard}
          </Button>
        </div>

        {messageKey && (
          <p className="text-sm text-slate-500">
            {messageKey === "serverErrorPrefix"
              ? `${copy.serverErrorPrefix}${messageDetail ?? ""}`
              : (copy.messages as any)[messageKey]}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>{copy.fields.activationCode}</Label>
        <Input
          placeholder={copy.fields.activationCodePlaceholder}
          {...form.register("activation_code")}
        />
        <p className="mt-1 text-xs text-slate-500">{copy.fields.activationCodeHelp}</p>
        {form.formState.errors.activation_code?.message && (
          <p className="mt-1 text-xs text-rose-500">
            {form.formState.errors.activation_code.message}
          </p>
        )}
      </div>

      <div>
        <Label>{copy.fields.personalEmail}</Label>
        <Input type="email" {...form.register("personal_email")} />
        <p className="mt-1 text-xs text-slate-500">{copy.fields.personalEmailHelp}</p>
        {form.formState.errors.personal_email?.message && (
          <p className="mt-1 text-xs text-rose-500">
            {form.formState.errors.personal_email.message}
          </p>
        )}
      </div>

      <div>
        <Label>{copy.fields.eduUsername}</Label>
        <Input {...form.register("edu_username")} />
        <p className="mt-1 text-xs text-slate-500">{copy.fields.eduUsernameHelp}</p>
        {form.formState.errors.edu_username?.message && (
          <p className="mt-1 text-xs text-rose-500">
            {form.formState.errors.edu_username.message}
          </p>
        )}
      </div>

      <div>
        <Label>{copy.fields.password}</Label>
        <Input type="password" {...form.register("password")} />
        <p className="mt-1 text-xs text-slate-500">{copy.fields.passwordHelp}</p>
        {form.formState.errors.password?.message && (
          <p className="mt-1 text-xs text-rose-500">{form.formState.errors.password.message}</p>
        )}
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? copy.messages.verifying : copy.buttons.submit}
      </Button>

      {messageKey && messageKey !== "verifying" && (
        <p className="text-sm text-rose-500">
          {messageKey === "serverErrorPrefix"
            ? `${copy.serverErrorPrefix}${messageDetail ?? ""}`
            : `${copy.messages[messageKey]}${messageDetail ? ` ${messageDetail}` : ""}`}
        </p>
      )}
    </form>
  );
}
