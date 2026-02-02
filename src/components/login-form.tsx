"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeTrim } from "@/lib/safe-trim";

const modes = ["personal", "edu"] as const;

type LoginLabels = {
  personalTab: string;
  eduTab: string;
  email: string;
  password: string;
  submit: string;
  required: string;
  success: string;
  failure: string;
  networkError: string;
};

type MessageTone = "success" | "error";

type Mode = (typeof modes)[number];

export function LoginForm({ labels }: { labels: LoginLabels }) {
  const [mode, setMode] = useState<Mode>("personal");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<MessageTone>("error");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMessage(null);
  }, [email, password, mode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("[login] submit clicked", { email, password: "***", mode });
    const normalizedEmail = safeTrim(email).toLowerCase();
    const normalizedPassword = safeTrim(password);

    if (!normalizedEmail || !normalizedPassword) {
      setMessageTone("error");
      setMessage(labels.required);
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword, mode })
      });
      const responseText = await res.text();

      if (!res.ok) {
        setMessageTone("error");
        setMessage(responseText || labels.failure);
        return;
      }

      setMessageTone("success");
      setMessage(labels.success);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 300);
    } catch (error) {
      console.error("[login] submit error", error);
      setMessageTone("error");
      setMessage(labels.networkError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <Button
          type="button"
          variant={mode === "personal" ? "default" : "outline"}
          onClick={() => setMode("personal")}
        >
          {labels.personalTab}
        </Button>
        <Button
          type="button"
          variant={mode === "edu" ? "default" : "outline"}
          onClick={() => setMode("edu")}
        >
          {labels.eduTab}
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>{labels.email}</Label>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
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
    </div>
  );
}
