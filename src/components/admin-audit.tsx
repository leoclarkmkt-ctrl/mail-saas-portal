"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/i18n";

type AdminAuditLabels = {
  searchPlaceholder: string;
  search: string;
  action: string;
  user: string;
  ip: string;
  time: string;
  failedToLoad: string;
  retry: string;
};

export function AdminAudit({ labels, lang }: { labels: AdminAuditLabels; lang: Locale }) {
  const [query, setQuery] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const trimmed = query.trim();
      const endpoint = trimmed ? `/api/admin/audit?query=${encodeURIComponent(trimmed)}` : "/api/admin/audit";
      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error(labels.failedToLoad);
      }
      const payload = await res.json();
      setLogs(payload.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.failedToLoad);
    }
  }, [query, labels.failedToLoad]);

  useEffect(() => {
    void load();
  }, [load, lang]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          className="w-full max-w-md"
          placeholder={labels.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button className="shrink-0" onClick={load}>
          {labels.search}
        </Button>
      </div>
      {error && (
        <div className="flex items-center gap-3 text-sm text-rose-500">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={load}>
            {labels.retry}
          </Button>
        </div>
      )}
      <div className="overflow-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">{labels.action}</th>
              <th className="p-3">{labels.user}</th>
              <th className="p-3">{labels.ip}</th>
              <th className="p-3">{labels.time}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-slate-100">
                <td className="p-3">{log.action}</td>
                <td className="p-3">{log.user_id ?? "-"}</td>
                <td className="p-3">{log.ip ?? "-"}</td>
                <td className="p-3">{log.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
