"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RedeemCopy, RedeemStatusKey } from "@/lib/redeem-copy";

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

type RedeemField = "activation_code" | "personal_email" | "edu_username" | "password";

export function RedeemForm({ copy, lang }: RedeemFormProps) {
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [status, setStatus] = useState<RedeemStatusKey>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [activationCode, setActivationCode] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [eduUsername, setEduUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RedeemField, RedeemErrorKey>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const params = useSearchParams();
  const runtimeLang = params.get("lang") === "zh" ? "zh" : params.get("lang") === "en" ? "en" : lang;

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

  const safeTrim = (value: unknown) => String(value ?? "").trim();

  const validateValues = (values: RedeemValues) => {
    const errors: Partial<Record<RedeemField, RedeemErrorKey>> = {};
    const activationValue = safeTrim(values.activation_code);
    const personalValue = safeTrim(values.personal_email);
    const eduValue = safeTrim(values.edu_username);
    const passwordValue = safeTrim(values.password);

    if (!activationValue) {
      errors.activation_code = "required_activation_code";
    }
    if (!personalValue) {
      errors.personal_email = "required_personal_email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalValue)) {
      errors.personal_email = "invalid_email";
    }
    if (!eduValue) {
      errors.edu_username = "required_username";
    } else if (!/^[a-zA-Z0-9._-]{3,32}$/.test(eduValue)) {
      errors.edu_username = "invalid_username";
    }
    if (!passwordValue) {
      errors.password = "required_password";
    } else {
      const passwordOk =
        passwordValue.length >= 8 &&
        /[A-Z]/.test(passwordValue) &&
        /[a-z]/.test(passwordValue) &&
        /\d/.test(passwordValue) &&
        /[^A-Za-z0-9]/.test(passwordValue);
      if (!passwordOk) {
        errors.password = "invalid_password_rules";
      }
    }

    return {
      errors,
      values: {
        activation_code: activationValue,
        personal_email: personalValue,
        edu_username: eduValue,
        password: passwordValue
      }
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("validating");
    setSubmitting(true);
    setServerError(null);
    try {
      const validation = validateValues({
        activation_code: activationCode,
        personal_email: personalEmail,
        edu_username: eduUsername,
        password
      });
      setFieldErrors(validation.errors);
      if (Object.keys(validation.errors).length > 0) {
        setStatus("error");
        return;
      }
      const values = validation.values;
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
          return;
        }
        if (!healthOk || !dbOk) {
          setStatus("error");
          return;
        }
      } catch (error) {
        setStatus("error");
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
          const detail = errorMessage || copy.submitFailedGeneric;
          setServerError(`${copy.serverErrorPrefix}${detail}`);
          return;
        }
        if (!parsed) {
          setStatus("error");
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
      return;
    } finally {
      setSubmitting(false);
    }
  };

  const copyInfo = async () => {
    if (!result) return;
    const text =
      `${copy.fields.personalEmail}: ${result.personal_email}\n` +
      `${copy.eduEmail}: ${result.edu_email}\n` +
      `${copy.fields.password}: ${result.password}\n` +
      `${copy.webmail}: ${result.webmail}\n` +
      `${copy.expiresAt}: ${result.expires_at}`;
    await navigator.clipboard.writeText(text);
    setServerError(null);
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
        {serverError && <p className="text-sm text-slate-500">{serverError}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>{copy.fields.activationCode}</Label>
        <Input
          placeholder={copy.fields.activationCodePlaceholder}
          value={activationCode}
          onChange={(event) => setActivationCode(event.target.value)}
        />
        <p className="mt-1 text-xs text-slate-500">{copy.fields.activationCodeHelp}</p>
        {fieldErrors.activation_code && (
          <p className="mt-1 text-xs text-rose-500">
            {copy.messages[fieldErrors.activation_code]}
          </p>
        )}
      </div>
      <div>
        <Label>{copy.fields.personalEmail}</Label>
        <Input
          type="email"
          value={personalEmail}
          onChange={(event) => setPersonalEmail(event.target.value)}
        />
        <p className="mt-1 text-xs text-slate-500">{copy.fields.personalEmailHelp}</p>
        {fieldErrors.personal_email && (
          <p className="mt-1 text-xs text-rose-500">
            {copy.messages[fieldErrors.personal_email]}
          </p>
        )}
      </div>
      <div>
        <Label>{copy.fields.eduUsername}</Label>
        <Input value={eduUsername} onChange={(event) => setEduUsername(event.target.value)} />
        <p className="mt-1 text-xs text-slate-500">{copy.fields.eduUsernameHelp}</p>
        {fieldErrors.edu_username && (
          <p className="mt-1 text-xs text-rose-500">
            {copy.messages[fieldErrors.edu_username]}
          </p>
        )}
      </div>
      <div>
        <Label>{copy.fields.password}</Label>
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <p className="mt-1 text-xs text-slate-500">{copy.fields.passwordHelp}</p>
        {fieldErrors.password && (
          <p className="mt-1 text-xs text-rose-500">
            {copy.messages[fieldErrors.password]}
          </p>
        )}
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? copy.messages.verifying : copy.buttons.submit}
      </Button>
      {serverError && <p className="text-sm text-rose-500">{serverError}</p>}
    </form>
  );
}
