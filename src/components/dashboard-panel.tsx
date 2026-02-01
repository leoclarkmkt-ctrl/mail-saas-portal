"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type DashboardData = {
  personalEmail: string;
  eduEmail: string;
  expiresAt: string;
  status: string;
  suspended: boolean;
};

export function DashboardPanel({ data, labels }: { data: DashboardData; labels: Record<string, string> }) {
  const [message, setMessage] = useState<string | null>(null);
  const [renewCode, setRenewCode] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const copyInfo = async () => {
    const text = `Edu Email: ${data.eduEmail}\nWebmail: https://mail.nsuk.edu.kg/`;
    await navigator.clipboard.writeText(text);
    setMessage(labels.copied);
  };

  const renew = async () => {
    setMessage(null);
    const res = await fetch("/api/dashboard/renew", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activation_code: renewCode })
    });
    const payload = await res.json();
    if (!res.ok) {
      setMessage(payload.error ?? "Failed");
      return;
    }
    window.location.reload();
  };

  const changePassword = async () => {
    setMessage(null);
    const res = await fetch("/api/dashboard/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
    });
    const payload = await res.json();
    if (!res.ok) {
      setMessage(payload.error ?? "Failed");
      return;
    }
    setMessage("Password updated");
    setOldPassword("");
    setNewPassword("");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">{labels.personalEmail}</p>
            <p className="text-lg font-semibold">{data.personalEmail}</p>
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
          <Button onClick={() => window.open("https://mail.nsuk.edu.kg/", "_blank")}>{labels.webmail}</Button>
          <Button variant="outline" onClick={copyInfo}>{labels.copyInfo}</Button>
        </div>
      </div>

      {data.suspended && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          {labels.suspended}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold">{labels.changePassword}</h3>
          <div className="mt-4 space-y-3">
            <div>
              <Label>{labels.oldPassword}</Label>
              <Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
            </div>
            <div>
              <Label>{labels.newPassword}</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <Button onClick={changePassword}>{labels.submit}</Button>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold">{labels.renew}</h3>
          <div className="mt-4 space-y-3">
            <Label>{labels.activationCode}</Label>
            <Input value={renewCode} onChange={(e) => setRenewCode(e.target.value)} />
            <Button onClick={renew}>{labels.renewSubmit}</Button>
          </div>
        </div>
      </div>
      {message && <p className="text-sm text-slate-500">{message}</p>}
    </div>
  );
}
