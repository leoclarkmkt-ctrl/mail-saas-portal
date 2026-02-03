"use client";

import { useEffect, useState } from "react";

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
};

export function AdminSummary({ labels }: { labels: AdminSummaryLabels }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/summary")
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) {
    return <p className="text-sm text-slate-500">{labels.loading}</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">{labels.activationCodes}</p>
        <p className="text-lg">
          {labels.unused}: {data.codes.unused} / {labels.used}: {data.codes.used} / {labels.revoked}: {data.codes.revoked}
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">{labels.users}</p>
        <p className="text-lg">{labels.total}: {data.users.total}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">{labels.eduAccounts}</p>
        <p className="text-lg">{labels.active}: {data.edu.active} / {labels.expired}: {data.edu.expired}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">{labels.last24h}</p>
        <p className="text-lg">{labels.redeems}: {data.activity.redeems} / {labels.logins}: {data.activity.logins}</p>
      </div>
    </div>
  );
}
