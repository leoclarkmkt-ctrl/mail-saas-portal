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
  failedToLoad: string;
  retry: string;
};

export function AdminSummary({ labels }: { labels: AdminSummaryLabels }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/summary");
      if (!res.ok) {
        throw new Error(labels.failedToLoad);
      }
      const payload = await res.json();
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.failedToLoad);
      setData(null);
    }
  }, [labels.failedToLoad]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-rose-500">{error}</p>
        <Button size="sm" onClick={load}>
          {labels.retry}
        </Button>
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-slate-500">{labels.loading}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">{labels.activationCodes}</p>
        <p className="text-lg">
          {labels.unused}: {data.codes.unused} / {labels.used}: {data.codes.used} / {labels.revoked}: {data.codes.revoked}
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">{labels.users}</p>
        <p className="text-lg">{labels.total}: {data.users.total}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">{labels.eduAccounts}</p>
        <p className="text-lg">
          {labels.active}: {data.edu.active} / {labels.expired}: {data.edu.expired}
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 md:col-span-2 xl:col-span-3">
        <p className="text-sm text-slate-500">{labels.last24h}</p>
        <p className="text-lg">
          {labels.redeems}: {data.activity.redeems} / {labels.logins}: {data.activity.logins}
        </p>
      </div>
    </div>
  );
}
