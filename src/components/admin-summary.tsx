"use client";

import { useEffect, useState } from "react";

export function AdminSummary() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/summary")
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Activation Codes</p>
        <p className="text-lg">Unused: {data.codes.unused} / Used: {data.codes.used} / Revoked: {data.codes.revoked}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Users</p>
        <p className="text-lg">Total: {data.users.total}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Edu Accounts</p>
        <p className="text-lg">Active: {data.edu.active} / Expired: {data.edu.expired}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Last 24h</p>
        <p className="text-lg">Redeems: {data.activity.redeems} / Logins: {data.activity.logins}</p>
      </div>
    </div>
  );
}
