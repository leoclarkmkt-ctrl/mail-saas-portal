"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUSES = ["all", "unused", "used", "revoked"] as const;

type Status = (typeof STATUSES)[number];

type AdminCodesLabels = {
  prefix: string;
  note: string;
  generate: string;
  exportCsv: string;
  search: string;
  searchPlaceholder: string;
  selected: string;
  batchRevoke: string;
  codesFailed: string;
  statuses: Record<Status, string>;
  code: string;
  status: string;
  created: string;
  actions: string;
  revoke: string;
};

export function AdminCodes({ labels }: { labels: AdminCodesLabels }) {
  const [codes, setCodes] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(10);
  const [prefix, setPrefix] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const activeQuery = useMemo(() => query.trim(), [query]);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (activeQuery) params.set("q", activeQuery);
    const queryString = params.toString();
    fetch(`/api/admin/codes${queryString ? `?${queryString}` : ""}`)
      .then((res) => res.json())
      .then((data) => {
        setCodes(data.data ?? []);
        setSelectedCodes(new Set());
      });
  }, [status, activeQuery]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const initialQuery = searchParams.get("q");
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [searchParams]);

  const generate = async () => {
    setMessage(null);
    const res = await fetch("/api/admin/codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity, prefix, note })
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? labels.codesFailed);
      return;
    }
    setCodes(data.codes);
  };

  const revoke = async (code: string) => {
    await fetch("/api/admin/codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });
    load();
  };

  const applySearch = () => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (activeQuery) params.set("q", activeQuery);
    router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
    load();
  };

  const exportCsv = async () => {
    const hasSelection = selectedCodes.size > 0;
    try {
      const res = await fetch(
        hasSelection ? "/api/admin/codes/export" : `/api/admin/codes/export?${buildExportParams()}`,
        {
          method: hasSelection ? "POST" : "GET",
          headers: hasSelection ? { "Content-Type": "application/json" } : undefined,
          body: hasSelection ? JSON.stringify({ codes: Array.from(selectedCodes) }) : undefined
        }
      );
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error ?? labels.codesFailed);
        return;
      }
      const text = await res.text();
      const filename = getFilenameFromResponse(res) ?? buildFallbackFilename(hasSelection);
      const blob = new Blob([text], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setMessage(labels.codesFailed);
    }
  };

  const toggleSelect = (code: string) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const allSelected = codes.length > 0 && codes.every((code) => selectedCodes.has(code.code));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedCodes(new Set());
      return;
    }
    setSelectedCodes(new Set(codes.map((code) => code.code)));
  };

  const revokeSelected = async () => {
    const codesToRevoke = Array.from(selectedCodes);
    if (codesToRevoke.length === 0) return;
    const res = await fetch("/api/admin/codes/revoke-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codes: codesToRevoke })
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? labels.codesFailed);
      return;
    }
    setMessage(null);
    setSelectedCodes(new Set());
    load();
  };

  const buildExportParams = () => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (activeQuery) params.set("q", activeQuery);
    return params.toString();
  };

  const getFilenameFromResponse = (res: Response) => {
    const disposition = res.headers.get("Content-Disposition");
    if (!disposition) return null;
    const match = disposition.match(/filename=([^;]+)/);
    if (!match) return null;
    return match[1];
  };

  const buildFallbackFilename = (selected: boolean) => {
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate()
    ).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    if (selected) {
      return `activation_codes-selected-${selectedCodes.size}-${stamp}.csv`;
    }
    return `activation_codes-${status}-${stamp}.csv`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="w-20"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
        <Input
          className="w-32 sm:w-40"
          placeholder={labels.prefix}
          value={prefix}
          onChange={(e) => setPrefix(e.target.value.toUpperCase())}
        />
        <Input
          className="w-64 max-w-full"
          placeholder={labels.note}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button className="shrink-0" onClick={generate}>
          {labels.generate}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
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
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {STATUSES.map((item) => (
          <Button
            key={item}
            size="sm"
            variant={status === item ? "default" : "outline"}
            onClick={() => setStatus(item)}
          >
            {labels.statuses[item]}
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Button className="shrink-0" variant="outline" onClick={exportCsv}>
            {selectedCodes.size > 0 ? `${labels.exportCsv} (${selectedCodes.size})` : labels.exportCsv}
          </Button>
        </div>
      </div>
      {selectedCodes.size > 0 && (
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span>
            {labels.selected}: {selectedCodes.size}
          </span>
          <Button size="sm" variant="outline" onClick={revokeSelected}>
            {labels.batchRevoke}
          </Button>
        </div>
      )}
      {message && <p className="text-sm text-rose-500">{message}</p>}
      <div className="overflow-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
              </th>
              <th className="p-3">{labels.code}</th>
              <th className="p-3">{labels.status}</th>
              <th className="p-3">{labels.created}</th>
              <th className="p-3">{labels.note}</th>
              <th className="p-3">{labels.actions}</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((code) => (
              <tr key={code.code} className="border-t border-slate-100">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedCodes.has(code.code)}
                    onChange={() => toggleSelect(code.code)}
                  />
                </td>
                <td className="p-3 font-mono text-xs">{code.code}</td>
                <td className="p-3">{code.status}</td>
                <td className="p-3">{code.created_at}</td>
                <td className="p-3">{code.note ?? "-"}</td>
                <td className="p-3">
                  {code.status === "unused" && (
                    <Button size="sm" variant="outline" onClick={() => revoke(code.code)}>
                      {labels.revoke}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
