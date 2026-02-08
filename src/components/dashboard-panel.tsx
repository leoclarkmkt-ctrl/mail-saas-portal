"use client";

import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  returnHome: string;
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
};

export function DashboardPanel({ data, labels }: { data: DashboardData; labels: DashboardLabels }) {
  const [message, setMessage] = useState<string | null>(null);
  const [renewEnabled, setRenewEnabled] = useState<boolean | null>(null);
  const [renewCode, setRenewCode] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);

  const oldPasswordId = useId();
  const newPasswordId = useId();
  const renewCodeId = useId();
  const messageId = useId();

  const webmailUrl = "https://portal.nsuk.edu.kg/edu-mail";
  const returnHomeUrl = "https://www.nsuk.edu.kg/zh";

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
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
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

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">{labels.personalEmail}</p>
            <p className="text-lg font-semibold">{maskEmail(data.personalEmail)}</p>
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

        {/* action bar */}
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={() => window.open(webmailUrl, "_blank")}>{labels.webmail}</Button>
          <Button onClick={() => (window.location.href = returnHomeUrl)}>{labels.returnHome}</Button>
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
                aria-describedby={message ? messageId : undefined}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor={newPasswordId}>{labels.newPassword}</Label>
              <Input
                id={newPasswordId}
                type="password"
                aria-describedby={message ? messageId : undefined}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <Button onClick={changePassword} disabled={isChanging} aria-busy={isChanging}>
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
              aria-describedby={message ? messageId : undefined}
              value={renewCode}
              onChange={(e) => setRenewCode(e.target.value)}
            />
            <Button onClick={renew} disabled={isRenewing} aria-busy={isRenewing}>
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
    </div>
  );
}
