"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readJsonResponse } from "@/lib/utils/safe-json";

type EduMailLoginFormProps = {
  errors: Record<string, string>;
  lang: "en" | "zh";
};

type LoginErrorResponse = {
  ok?: boolean;
  error?: { field?: string; key?: string; message?: string } | string;
};

export function EduMailLoginForm({ errors, lang }: EduMailLoginFormProps) {
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolveErrorMessage = (key?: string) =>
    errors[key ?? ""] ?? errors.unknown ?? "Request failed";

  const withLangQuery = (path: string) => {
    if (!lang) return path;
    const separator = path.includes("?") ? "&" : "?";
    return `${path}${separator}lang=${lang}`;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage(resolveErrorMessage("login_edu_email_required"));
      return;
    }
    if (!password.trim()) {
      setErrorMessage(resolveErrorMessage("login_edu_password_required"));
      return;
    }

    setIsSubmitting(true);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, mode: "edu" })
    });

    const { data } = await readJsonResponse<LoginErrorResponse>(res);

    if (!res.ok) {
      const errorObj = typeof data?.error === "object" ? data?.error : undefined;
      if (errorObj?.key) {
        setErrorMessage(resolveErrorMessage(errorObj.key));
      } else {
        setErrorMessage(resolveErrorMessage("unknown"));
      }
      setIsSubmitting(false);
      return;
    }

    const destination = withLangQuery("/edu-mail/inbox");
    window.location.href = destination;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {errorMessage}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={emailId} className="text-sm font-semibold text-slate-700">
          User ID / Email
        </Label>
        <Input
          id={emailId}
          type="email"
          placeholder="yourname@nsuk.edu.kg"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={passwordId} className="text-sm font-semibold text-slate-700">
          Password
        </Label>
        <div className="relative">
          <Input
            id={passwordId}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-accent"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full bg-cta text-white hover:bg-[#ff7c4f]"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Signing In..." : "Sign In"}
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link className="text-accent hover:text-neon" href={withLangQuery("/forgot")}>
          Forgot Password?
        </Link>
        <Link className="text-accent hover:text-neon" href={withLangQuery("/")}>
          Back to Home
        </Link>
      </div>
    </form>
  );
}
