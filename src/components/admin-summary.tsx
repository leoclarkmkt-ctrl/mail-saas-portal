"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type AdminSummaryLabels = {
  loading: string;
  activationCodes: string;
  unused: string;
  used: string;
  revoked: string;
  users: string;
  total: string;
  eduAccounts: string;
  active: string;
  expired: string;
  last24h: string;
  redeems: string;
  logins: string;
  presence: string;
  onlineUsers: string;
  activeUsers: string;
  failedToLoad: string;
  retry: string;
};

type AdminStatsData = {
  activationCodes: { unused: number; used: number; revoked: number };
  users: { total: number };
  mailboxes: { active: number; expired: number };
  last24h: { redeemed: number; logins: number };
  presence: { online5m: number; active24h: number };
};

const EMPTY_STATS: AdminStatsData = {
  activationCodes: { unused: 0, used: 0, revoked: 0 },
  users: { total: 0 },
  mailboxes: { active: 0, expired: 0 },
  last24h: { redeemed: 0, logins: 0 },
  presence: { online5m: 0, active24h: 0 }
};

export function AdminSummary({ labels }: { labels: AdminSummaryLabels }) {
  const [data, setData] = useState<AdminStatsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        throw new Error(labels.failedToLoad);
      }
      const payload = await res.json();
      if (!payload?.ok) {
        throw new Error(labels.failedToLoad);
      }
      setData(payload.data ?? EMPTY_STATS);
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.failedToLoad);
      setData(EMPTY_STATS);
    }
  }, [labels.failedToLoad]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!data) {
    return <p className="text-sm text-slate-500">{labels.loading}</p>;
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="space-y-2">
          <p className="text-sm text-rose-500">{error}</p>
          <Button size="sm" onClick={load}>
            {labels.retry}
          </Button>
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">{labels.activationCodes}</p>
          <p className="text-lg">
            {labels.unused}: {data.activationCodes.unused} / {labels.used}: {data.activationCodes.used} /{" "}
            {labels.revoked}: {data.activationCodes.revoked}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">{labels.users}</p>
          <p className="text-lg">
            {labels.total}: {data.users.total}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">{labels.eduAccounts}</p>
          <p className="text-lg">
            {labels.active}: {data.mailboxes.active} / {labels.expired}: {data.mailboxes.expired}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">{labels.presence}</p>
          <p className="text-lg">
            {labels.onlineUsers}: {data.presence.online5m} / {labels.activeUsers}: {data.presence.active24h}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 md:col-span-2 xl:col-span-2">
          <p className="text-sm text-slate-500">{labels.last24h}</p>
          <p className="text-lg">
            {labels.redeems}: {data.last24h.redeemed} / {labels.logins}: {data.last24h.logins}
          </p>
        </div>
      </div>
    </div>
  );
}
