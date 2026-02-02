"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeTrim } from "@/lib/safe-trim";

type ForgotLabels = {
  email: string;
  submit: string;
  notice: string;
  required: string;
  failure: string;
  networkError: string;
};

type MessageTone = "success" | "error";

export function ForgotForm({ labels }: { labels: ForgotLabels }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<MessageTone>("error");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMessage(null);
  }, [email]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("[forgot] submit clicked", { email });
    const normalizedEmail = safeTrim(email).toLowerCase();

    if (!normalizedEmail) {
      setMessageTone("error");
      setMessage(labels.required);
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personal_email: normalizedEmail })
      });
      const responseText = await res.text();

      if (!res.ok) {
        setMessageTone("error");
        setMessage(responseText || labels.failure);
        return;
      }

      setMessageTone("success");
      setMessage(labels.notice);
    } catch (error) {
      console.error("[forgot] submit error", error);
      setMessageTone("error");
      setMessage(labels.networkError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>{labels.email}</Label>
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
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
