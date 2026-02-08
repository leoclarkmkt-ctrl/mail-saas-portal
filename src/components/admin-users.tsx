"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/i18n";

type AdminUsersLabels = {
  searchPlaceholder: string;
  search: string;
  personalEmail: string;
  eduEmail: string;
  expires: string;
  status: string;
  actions: string;
  renew: string;
  suspend: string;
  unsuspend: string;
  resetPassword: string;
  tempPassword: string;
  suspended: string;
  renewYears: string;
  failedToLoad: string;
  retry: string;
};

export function AdminUsers({ labels, lang }: { labels: AdminUsersLabels; lang: Locale }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [years, setYears] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?query=${encodeURIComponent(query)}`);
      if (!res.ok) {
        throw new Error(labels.failedToLoad);
      }
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.failedToLoad);
    }
  }, [query, labels.failedToLoad]);

  useEffect(() => {
    void search();
  }, [search, lang]);

  const renew = async (userId: string) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, years })
    });
    search();
  };

  const toggleSuspend = async (userId: string, suspended: boolean) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, suspend: !suspended })
    });
    search();
  };

  const resetPassword = async (userId: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, reset_password: true })
    });
    const data = await res.json();
    if (res.ok && data.temp_password) {
      setMessage(`${labels.tempPassword}: ${data.temp_password}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Input placeholder={labels.searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button onClick={search}>{labels.search}</Button>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span>{labels.renewYears}</span>
          <Input className="w-20" type="number" min={1} value={years} onChange={(e) => setYears(Number(e.target.value) || 1)} />
        </label>
      </div>
      {error && (
        <div className="flex items-center gap-3 text-sm text-rose-500">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={search}>
            {labels.retry}
          </Button>
        </div>
      )}
      {message && <p className="text-sm text-slate-500">{message}</p>}
      <div className="overflow-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">{labels.personalEmail}</th>
              <th className="p-3">{labels.eduEmail}</th>
              <th className="p-3">{labels.expires}</th>
              <th className="p-3">{labels.status}</th>
              <th className="p-3">{labels.actions}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id} className="border-t border-slate-100">
                <td className="p-3">{user.personal_email}</td>
                <td className="p-3">{user.edu_email}</td>
                <td className="p-3">{user.expires_at}</td>
                <td className="p-3">{user.is_suspended ? labels.suspended : user.status}</td>
                <td className="flex gap-2 p-3">
                  <Button size="sm" onClick={() => renew(user.user_id)}>{labels.renew}</Button>
                  <Button size="sm" variant="outline" onClick={() => toggleSuspend(user.user_id, user.is_suspended)}>
                    {user.is_suspended ? labels.unsuspend : labels.suspend}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => resetPassword(user.user_id)}>
                    {labels.resetPassword}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
