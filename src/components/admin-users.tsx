"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  statusLabels: Record<string, string>;
  actions: string;
  renew: string;
  suspend: string;
  unsuspend: string;
  resetPassword: string;
  tempPassword: string;
  suspended: string;
  failedToLoad: string;
  retry: string;
};

const PAGE_SIZE = 50;

const normalizePage = (value: number) => {
  if (!Number.isFinite(value) || value < 1) return 1;
  return Math.floor(value);
};

export function AdminUsers({
  labels,
  lang,
  initialQuery,
  initialPage
}: {
  labels: AdminUsersLabels;
  lang: Locale;
  initialQuery: string;
  initialPage: number;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [page, setPage] = useState(normalizePage(initialPage));
  const [users, setUsers] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pathname = usePathname();
  const router = useRouter();

  const syncUrl = useCallback(
    (nextPage: number, nextQuery: string) => {
      const params = new URLSearchParams();
      params.set("lang", lang);
      if (nextPage > 1) params.set("page", String(nextPage));
      if (nextQuery.trim()) params.set("query", nextQuery.trim());
      router.replace(`${pathname}?${params.toString()}`);
    },
    [lang, pathname, router]
  );

  const load = useCallback(
    async (nextPage: number, nextQuery: string) => {
      setError(null);
      const safePage = normalizePage(nextPage);
      try {
        const params = new URLSearchParams();
        params.set("page", String(safePage));
        params.set("query", nextQuery.trim());
        const res = await fetch(`/api/admin/users?${params.toString()}`);
        if (!res.ok) {
          throw new Error(labels.failedToLoad);
        }
        const data = await res.json();
        const safeResponsePage = normalizePage(Number(data.page ?? safePage));
        const safeTotalPages = Math.max(1, Number(data.totalPages ?? 1));
        setUsers(data.users ?? []);
        setPage(safeResponsePage);
        setTotalPages(safeTotalPages);
        if (safeResponsePage !== safePage) {
          syncUrl(safeResponsePage, nextQuery);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : labels.failedToLoad);
      }
    },
    [labels.failedToLoad, syncUrl]
  );

  useEffect(() => {
    void load(page, activeQuery);
  }, [load, page, activeQuery, lang]);

  const renew = async (userId: string) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, action: "renew" })
    });
    void load(page, activeQuery);
  };

  const toggleSuspend = async (userId: string, suspended: boolean) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, suspend: !suspended })
    });
    void load(page, activeQuery);
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

  const resolveStatusLabel = (status: string | null | undefined, isSuspended: boolean) => {
    if (isSuspended) {
      return labels.statusLabels.suspended ?? labels.suspended ?? status ?? "-";
    }
    if (!status) return labels.statusLabels.unknown ?? status ?? "-";
    return labels.statusLabels[status] ?? status ?? labels.statusLabels.unknown ?? "Unknown";
  };

  const pageText = useMemo(
    () => (lang === "zh" ? `第 ${page} 页 / 共 ${totalPages} 页` : `Page ${page} / ${totalPages}`),
    [lang, page, totalPages]
  );

  const applySearch = () => {
    const trimmed = query.trim();
    setActiveQuery(trimmed);
    setPage(1);
    syncUrl(1, trimmed);
  };

  const goPrev = () => {
    const prevPage = Math.max(1, page - 1);
    setPage(prevPage);
    syncUrl(prevPage, activeQuery);
  };

  const goNext = () => {
    const nextPage = Math.min(totalPages, page + 1);
    setPage(nextPage);
    syncUrl(nextPage, activeQuery);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          className="w-full max-w-md"
          placeholder={labels.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button className="shrink-0" onClick={applySearch}>
          {labels.search}
        </Button>
      </div>
      {error && (
        <div className="flex items-center gap-3 text-sm text-rose-500">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={() => void load(page, activeQuery)}>
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
                <td className="p-3">{resolveStatusLabel(user.status, user.is_suspended)}</td>
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

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>{pageText}</span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={goPrev} disabled={page <= 1}>
            {lang === "zh" ? "上一页" : "Previous"}
          </Button>
          <Button size="sm" variant="outline" onClick={goNext} disabled={page >= totalPages}>
            {lang === "zh" ? "下一页" : "Next"}
          </Button>
        </div>
      </div>
      <p className="text-xs text-slate-500">{lang === "zh" ? `每页最多 ${PAGE_SIZE} 条` : `Up to ${PAGE_SIZE} per page`}</p>
    </div>
  );
}
