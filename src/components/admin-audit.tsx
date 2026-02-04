"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminAuditLabels = {
  searchPlaceholder: string;
  search: string;
  action: string;
  user: string;
  ip: string;
  time: string;
};

export function AdminAudit({ labels }: { labels: AdminAuditLabels }) {
  const [query, setQuery] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/audit?query=${encodeURIComponent(query)}`);
      if (!res.ok) {
        throw new Error("Failed to load");
      }
      const data = await res.json();
      setLogs(data.logs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Input placeholder={labels.searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button onClick={load}>{labels.search}</Button>
      </div>
      {error && (
        <div className="flex items-center gap-3 text-sm text-rose-500">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={load}>
            Retry
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
