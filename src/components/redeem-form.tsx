"use client";

import { useMemo, useState } from "react";
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

  const statusText = useMemo(() => copy.status[status], [copy.status, status]);

  const setFieldError = (field: keyof RedeemValues, key: RedeemErrorKey) => {
    form.setError(field, { type: "manual", message: key });
  };

  const validateValues = (values: RedeemValues) => {
    let valid = true;
    form.clearErrors();
    if (!values.activation_code.trim()) {
      setFieldError("activation_code", "required_activation_code");
      valid = false;
    }
    if (!values.personal_email.trim()) {
      setFieldError("personal_email", "required_personal_email");
      valid = false;
    } else {
      const emailOk = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(values.personal_email);
      if (!emailOk) {
        setFieldError("personal_email", "invalid_email");
        valid = false;
      }
    }
    if (!values.edu_username.trim()) {
      setFieldError("edu_username", "required_username");
      valid = false;
    }
    if (!values.password.trim()) {
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
    setMessageKey(null);
    setMessageDetail(null);
    setStatus("validating");
    const values = form.getValues();
    const valid = validateValues(values);
    if (!valid) {
      setStatus("error");
      setMessageKey("submit_failed_generic");
      return;
    }
    setStatus("submitting");
    setSubmitting(true);
    console.log("Redeem submit payload", values);
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const data = await res.json().catch(async () => {
        const text = await res.text();
        return { error: text };
      });
      if (!res.ok) {
        setStatus("error");
        setMessageKey("serverErrorPrefix");
        const detail =
          runtimeLang === "zh" ? copy.submitFailedGeneric : data.error || copy.submitFailedGeneric;
        setMessageDetail(detail);
        return;
      }
      setResult(data);
      setStatus("success");
      setMessageKey("submit_success");
    } catch {
      setStatus("error");
      setMessageKey("network_error");
    } finally {
      setSubmitting(false);
    }
  };

  const copyInfo = async () => {
    if (!result) return;
    const text = `${copy.eduEmail}: ${result.edu_email}\n${copy.fields.password}: ${result.password}\n${copy.webmail}: ${result.webmail}`;
    await navigator.clipboard.writeText(text);
    setMessageKey(null);
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
        {submitting ? copy.messages.submitting : copy.buttons.submit}
      </Button>
      <div className="rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-500">
        {statusText}
      </div>
      {messageKey && (
        <p className="text-sm text-rose-500">
          {messageKey === "serverErrorPrefix"
            ? `${copy.serverErrorPrefix}${messageDetail ?? ""}`
            : copy.messages[messageKey]}
        </p>
      )}
    </form>
  );
}
