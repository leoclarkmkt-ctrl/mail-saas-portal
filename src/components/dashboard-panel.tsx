"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/i18n";
import { withLang } from "@/lib/i18n/shared";
import { maskEmail } from "@/lib/utils/format";

export type DashboardData = {
  personalEmail: string;
  eduEmail: string;
  expiresAt: string;
  status: string;
  suspended: boolean;
  expired: boolean;
};

type DashboardLabels = {
  personalEmail: string;
  eduEmail: string;
  status: string;
  expiresAt: string;
  webmail: string;
  logout: string;
  changePassword: string;
  passwordHint: string;
  oldPassword: string;
  newPassword: string;
  submit: string;
  passwordUpdated: string;
  renew: string;
  renewHint: string;
  activationCode: string;
  renewSubmit: string;
  renewSuccess: string;
  suspended: string;
  expiredNotice: string;
  renewEnableFailed: string;
  errorFallback: string;
  errorMessages: Record<string, string>;
  eduMailExpiredTitle: string;
  eduMailExpiredBody: string;
  ok: string;
};

export function DashboardPanel({
  data,
  labels,
  lang,
  showEduExpiredOnLoad,
}: {
  data: DashboardData;
  labels: DashboardLabels;
  lang?: Locale;
  showEduExpiredOnLoad?: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [renewEnabled, setRenewEnabled] = useState<boolean | null>(null);
  const [renewCode, setRenewCode] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCheckingEdu, setIsCheckingEdu] = useState(false);
  const [showEduExpired, setShowEduExpired] = useState(false);

  const oldPasswordId = useId();
  const newPasswordId = useId();
  const renewCodeId = useId();
  const messageId = useId();
  const eduModalTitleId = useId();
  const eduModalBodyId = useId();

  const homeUrl = "https://www.nsuk.edu.kg/";

  const parseJson = async <T,>(res: Response): Promise<T | null> => {
    try {
      return (await res.json()) as T;
    } catch {
      return null;
    }
  };

  const resolveErrorMessage = (key?: string) => {
    if (key && labels.errorMessages[key]) {
      return labels.errorMessages[key];
    }
    return labels.errorMessages.unknown ?? labels.errorFallback;
  };

  const renew = async () => {
    setMessage(null);
    setIsRenewing(true);
    try {
      const res = await fetch("/api/dashboard/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activation_code: renewCode }),
      });

      const payload = await parseJson<{
        error?: { key?: string };
        enabled?: boolean;
        message?: string;
      }>(res);

      if (!res.ok) {
        setMessage(resolveErrorMessage(payload?.error?.key));
        return;
      }

      if (payload?.enabled === false) {
        setRenewEnabled(false);
        setMessage(payload?.message ?? labels.renewEnableFailed);
        return;
      }

      setRenewEnabled(true);
      setMessage(labels.renewSuccess);
      setTimeout(() => window.location.reload(), 800);
    } finally {
      setIsRenewing(false);
    }
  };

  const changePassword = async () => {
    setMessage(null);
    setIsChanging(true);
    try {
      const res = await fetch("/api/dashboard/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      const payload = await parseJson<{ error?: { key?: string } }>(res);

      if (!res.ok) {
        setMessage(resolveErrorMessage(payload?.error?.key));
        return;
      }

      setMessage(labels.passwordUpdated);
      setOldPassword("");
      setNewPassword("");
    } finally {
      setIsChanging(false);
    }
  };

  const logout = async () => {
    setMessage(null);
    setIsLoggingOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      window.location.href = homeUrl;
      setIsLoggingOut(false);
    }
  };

  const handleEduLogin = async () => {
    setIsCheckingEdu(true);
    try {
      const res = await fetch(withLang("/api/edu-mail/status", lang), {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const payload = await parseJson<{ active?: boolean; expired?: boolean }>(
        res
      );

      // ✅ only redirect when active === true
      if (res.ok && payload?.active === true) {
        window.location.href = withLang("/api/edu-mail/sso", lang);
        return;
      }
    } catch {
      // ignore
    } finally {
      setIsCheckingEdu(false);
    }

    setShowEduExpired(true);
  };

  // 自动弹窗（来自 /dashboard?edu=expired）
  useEffect(() => {
    if (showEduExpiredOnLoad) {
      setShowEduExpired(true);
    }
  }, [showEduExpiredOnLoad]);

  // 打开弹窗后清理 URL，避免“粘性弹窗”
  useEffect(() => {
    if (!showEduExpired || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("edu") !== "expired") return;
    url.searchParams.delete("edu");
    window.history.replaceState({}, "", url.toString());
  }, [showEduExpired]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">{labels.personalEmail}</p>
            <p className="text-lg font-semibold">
              {maskEmail(data.personalEmail)}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">{labels.eduEmail}</p>
            <p className="text-lg font-semibold">{data.eduEmail}</p>
          </div>

          <div>
            <p className="text-sm text-slate-500">{labels.status}</p>
            <p className="text-lg font-semibold">{data.status}</p>
          </div>

          <div>
            <p className="text-sm text-slate-500">{labels.expiresAt}</p>
            <p className="text-lg font-semibold">{data.expiresAt}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            onClick={handleEduLogin}
            disabled={isCheckingEdu}
            aria-busy={isCheckingEdu}
          >
            {labels.webmail}
          </Button>
          <Button
            onClick={logout}
            disabled={isLoggingOut}
            aria-busy={isLoggingOut}
          >
            {labels.logout}
          </Button>
        </div>
      </div>

      {data.suspended && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          {labels.suspended}
        </div>
      )}

      {!data.suspended && data.expired && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          {labels.expiredNotice}
        </div>
      )}

      {renewEnabled === false && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          {labels.renewEnableFailed}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold">{labels.changePassword}</h3>
          <p className="text-xs text-slate-500">{labels.passwordHint}</p>

          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor={oldPasswordId}>{labels.oldPassword}</Label>
              <Input
                id={oldPasswordId}
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor={newPasswordId}>{labels.newPassword}</Label>
              <Input
                id={newPasswordId}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <Button onClick={changePassword} disabled={isChanging}>
              {labels.submit}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold">{labels.renew}</h3>
          <p className="text-xs text-slate-500">{labels.renewHint}</p>

          <div className="mt-4 space-y-3">
            <Label htmlFor={renewCodeId}>{labels.activationCode}</Label>
            <Input
              id={renewCodeId}
              value={renewCode}
              onChange={(e) => setRenewCode(e.target.value)}
            />
            <Button onClick={renew} disabled={isRenewing}>
              {labels.renewSubmit}
            </Button>
          </div>
        </div>
      </div>

      {message && (
        <p className="text-sm text-slate-500" id={messageId}>
          {message}
        </p>
      )}

      {showEduExpired && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={eduModalTitleId}
          aria-describedby={eduModalBodyId}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold" id={eduModalTitleId}>
              {labels.eduMailExpiredTitle}
            </h3>
            <p className="mt-2 text-sm text-slate-600" id={eduModalBodyId}>
              {labels.eduMailExpiredBody}
            </p>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowEduExpired(false)}>
                {labels.ok}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
