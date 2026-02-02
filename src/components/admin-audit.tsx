"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminAudit() {
  const [query, setQuery] = useState("");
  const [logs, setLogs] = useState<any[]>([]);

  const load = () => {
    fetch(`/api/admin/audit?query=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => setLogs(data.logs ?? []));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Input placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button onClick={load}>Search</Button>
      </div>
      <div className="overflow-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Action</th>
              <th className="p-3">User</th>
              <th className="p-3">IP</th>
              <th className="p-3">Time</th>
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
