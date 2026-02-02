"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeTrim } from "@/lib/safe-trim";

type RedeemLabels = {
  activationCode: string;
  personalEmail: string;
  eduUsername: string;
  password: string;
  submit: string;
  successTitle: string;
  webmail: string;
  dashboard: string;
  copyInfo: string;
  expiresAt: string;
  copied: string;
  required: string;
  failure: string;
  networkError: string;
};

type MessageTone = "success" | "error";

type RedeemResult = {
  personal_email: string;
  edu_email: string;
  expires_at: string;
  password: string;
  webmail: string;
};

export function RedeemForm({ labels }: { labels: RedeemLabels }) {
  const [activationCode, setActivationCode] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [eduUsername, setEduUsername] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<MessageTone>("error");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMessage(null);
  }, [activationCode, personalEmail, eduUsername, password]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("[redeem] submit clicked", {
      activation_code: activationCode,
      personal_email: personalEmail,
      edu_username: eduUsername
    });

    const normalizedActivationCode = safeTrim(activationCode);
    const normalizedPersonalEmail = safeTrim(personalEmail).toLowerCase();
    const normalizedEduUsername = safeTrim(eduUsername).toLowerCase();
    const normalizedPassword = safeTrim(password);

    if (!normalizedActivationCode || !normalizedPersonalEmail || !normalizedEduUsername || !normalizedPassword) {
      setMessageTone("error");
      setMessage(labels.required);
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activation_code: normalizedActivationCode,
          personal_email: normalizedPersonalEmail,
          edu_username: normalizedEduUsername,
          password: normalizedPassword
        })
      });
      const responseText = await res.text();

      if (!res.ok) {
        setMessageTone("error");
        setMessage(responseText || labels.failure);
        return;
      }

      try {
        const data = responseText ? (JSON.parse(responseText) as RedeemResult) : null;
        if (!data) {
          setMessageTone("error");
          setMessage(labels.failure);
          return;
        }
        setResult(data);
        setMessage(null);
      } catch (error) {
        console.error("[redeem] response parse error", error);
        setMessageTone("error");
        setMessage(labels.failure);
      }
    } catch (error) {
      console.error("[redeem] submit error", error);
      setMessageTone("error");
      setMessage(labels.networkError);
    } finally {
      setLoading(false);
    }
  };

  const copyInfo = async () => {
    if (!result) return;
    const text = `Edu Email: ${result.edu_email}\nPassword: ${result.password}\nWebmail: ${result.webmail}`;
    await navigator.clipboard.writeText(text);
    setMessageTone("success");
    setMessage(labels.copied);
  };

  if (result) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {labels.successTitle}
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <p>
            {labels.personalEmail}: {result.personal_email}
          </p>
          <p>Edu Email: {result.edu_email}</p>
          <p>
            {labels.expiresAt}: {result.expires_at}
          </p>
          <p>
            {labels.webmail}: {result.webmail}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={copyInfo}>
            {labels.copyInfo}
          </Button>
          <Button type="button" variant="outline" onClick={() => (window.location.href = "/dashboard")}>
            {labels.dashboard}
          </Button>
        </div>
        {message && (
          <p className={messageTone === "success" ? "text-sm text-emerald-600" : "text-sm text-rose-500"}>
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>{labels.activationCode}</Label>
        <Input value={activationCode} onChange={(event) => setActivationCode(event.target.value)} />
      </div>
      <div>
        <Label>{labels.personalEmail}</Label>
        <Input type="email" value={personalEmail} onChange={(event) => setPersonalEmail(event.target.value)} />
      </div>
      <div>
        <Label>{labels.eduUsername}</Label>
        <Input value={eduUsername} onChange={(event) => setEduUsername(event.target.value)} />
      </div>
      <div>
        <Label>{labels.password}</Label>
        <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </div>
      <Button type="submit" disabled={loading}>
        {labels.submit}
      </Button>
      {message && (
        <p className={messageTone === "success" ? "text-sm text-emerald-600" : "text-sm text-rose-500"}>
          {message}
        </p>
      )}
    </form>
  );
}
