"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/i18n";
import { getAuditActionText } from "@/lib/audit/action-labels";

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

type AdminAuditProps = {
  labels: AdminAuditLabels;
  lang: Locale;
};

const formatRelativeTime = (date: Date, lang: Locale) => {
  if (Number.isNaN(date.getTime())) return "-";
  const diffMs = Date.now() - date.getTime();
  if (!Number.isFinite(diffMs)) return "-";
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSeconds < 60) return lang === "zh" ? "刚刚" : "just now";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return lang === "zh" ? `${diffMinutes} 分钟前` : `${diffMinutes} minutes ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return lang === "zh" ? `${diffHours} 小时前` : `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  return lang === "zh" ? `${diffDays} 天前` : `${diffDays} days ago`;
};

const formatLocalTime = (value: string, lang: Locale) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const locale = lang === "zh" ? "zh-CN" : "en-US";
  return date.toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

export function AdminAudit({ labels, lang }: AdminAuditProps) {
  const [query, setQuery] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const trimmed = query.trim();
      const endpoint = trimmed
        ? `/api/admin/audit?query=${encodeURIComponent(trimmed)}`
        : "/api/admin/audit";

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(labels.failedToLoad);

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
                <td className="p-3">{getAuditActionText(log.action, lang)}</td>
                <td className="p-3">{log.edu_email ?? "-"}</td>
                <td className="p-3">
                  {typeof log.ip === "string" && log.ip.trim() && log.ip !== "-" ? log.ip : "-"}
                </td>
                <td className="p-3">
                  <div className="flex flex-col">
                    <span>{formatLocalTime(log.created_at, lang)}</span>
                    <span className="text-xs text-slate-500">
                      {formatRelativeTime(new Date(log.created_at), lang)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td className="p-3 text-slate-500" colSpan={4}>
                  -
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
