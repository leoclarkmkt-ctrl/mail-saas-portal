"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";

const STATUSES = ["all", "unused", "used", "revoked"] as const;

type Status = (typeof STATUSES)[number];

type AlertDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  loadingLabel: string;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function AlertDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  loadingLabel,
  isLoading,
  onCancel,
  onConfirm
}: AlertDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? loadingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

type AdminCodesLabels = {
  prefix: string;
  note: string;
  generate: string;
  generating: string;
  export: string;
  exporting: string;
  exportCsv: string;
  search: string;
  searchPlaceholder: string;
  searchLabel: string;
  searchHelp: string;
  selected: string;
  selectedHelp: string;
  batchRevoke: string;
  revoking: string;
  revokeConfirmTitle: string;
  revokeConfirmDescription: string;
  revokeConfirmAction: string;
  batchRevokeConfirmTitle: string;
  batchRevokeConfirmDescription: string;
  batchRevokeConfirmAction: string;
  confirmCancel: string;
  confirmProcessing: string;
  codesFailed: string;
  statuses: Record<Status, string>;
  statusLabels: Record<string, string>;
  formLabels: {
    quantity: string;
    prefix: string;
    note: string;
  };
  formHelp: {
    quantity: string;
    prefix: string;
    note: string;
  };
  placeholders: {
    quantity: string;
    prefix: string;
    note: string;
  };
  toasts: {
    generateSuccess: string;
    generateFailed: string;
    exportFilteredSuccess: string;
    exportSelectedSuccess: string;
    exportFailed: string;
    revokeSuccess: string;
    revokeFailed: string;
    revokeSingleSuccess: string;
  };
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
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "single" | "batch";
    code?: string;
  } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const showToast = (type: "success" | "error", toastMessage: string) => {
    setToast({ type, message: toastMessage });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const formatToast = (template: string, values: Record<string, string | number>) => {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(values[key] ?? ""));
  };

  const generate = async () => {
    setMessage(null);
    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity, prefix, note })
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? labels.codesFailed);
        showToast("error", labels.toasts.generateFailed);
        return;
      }
      setCodes(data.codes);
      showToast("success", formatToast(labels.toasts.generateSuccess, { count: quantity }));
      setSelectedCodes(new Set());
      load();
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setMessage(labels.codesFailed);
      showToast("error", labels.toasts.generateFailed);
    } finally {
      setIsGenerating(false);
    }
  };

  const revoke = (code: string) => {
    setConfirmDialog({ type: "single", code });
  };

  const confirmRevokeSingle = async () => {
    if (!confirmDialog?.code) return;
    setIsRevoking(true);
    try {
      const res = await fetch("/api/admin/codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: confirmDialog.code })
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error ?? labels.codesFailed);
        showToast("error", labels.toasts.revokeFailed);
        return;
      }
      showToast("success", labels.toasts.revokeSingleSuccess);
      load();
    } catch {
      setMessage(labels.codesFailed);
      showToast("error", labels.toasts.revokeFailed);
    } finally {
      setIsRevoking(false);
      setConfirmDialog(null);
    }
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
    setIsExporting(true);
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
      if (hasSelection) {
        showToast("success", formatToast(labels.toasts.exportSelectedSuccess, { count: selectedCodes.size }));
      } else {
        showToast("success", labels.toasts.exportFilteredSuccess);
      }
    } catch {
      setMessage(labels.codesFailed);
      showToast("error", labels.toasts.exportFailed);
    } finally {
      setIsExporting(false);
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
    setConfirmDialog({ type: "batch" });
  };

  const confirmRevokeBatch = async () => {
    const codesToRevoke = Array.from(selectedCodes);
    if (codesToRevoke.length === 0) {
      setConfirmDialog(null);
      return;
    }
    setIsRevoking(true);
    try {
      const res = await fetch("/api/admin/codes/revoke-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes: codesToRevoke })
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? labels.codesFailed);
        showToast("error", labels.toasts.revokeFailed);
        return;
      }
      setMessage(null);
      setSelectedCodes(new Set());
      showToast(
        "success",
        formatToast(labels.toasts.revokeSuccess, { revoked: data.updated ?? 0, skipped: data.skipped ?? 0 })
      );
      load();
    } catch {
      setMessage(labels.codesFailed);
      showToast("error", labels.toasts.revokeFailed);
    } finally {
      setIsRevoking(false);
      setConfirmDialog(null);
    }
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
      <div className="w-full max-w-2xl">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-[140px] flex-1 flex-col gap-1">
            <label className="text-base font-medium text-slate-500">{labels.formLabels.quantity}</label>
            <Input
              type="number"
              value={quantity}
              placeholder={labels.placeholders.quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>

          <div className="flex min-w-[160px] flex-1 flex-col gap-1">
            <label className="text-base font-medium text-slate-500">{labels.formLabels.prefix}</label>
            <Input
              placeholder={labels.placeholders.prefix}
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
            />
          </div>

          <div className="flex min-w-[200px] flex-1 flex-col gap-1">
            <label className="text-base font-medium text-slate-500">{labels.formLabels.note}</label>
            <Input placeholder={labels.placeholders.note} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <Button className="shrink-0" onClick={generate} disabled={isGenerating}>
            {isGenerating ? labels.generating : labels.generate}
          </Button>
        </div>
      </div>

      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-2">
          <Input
            className="w-full max-w-md"
            placeholder="搜索激活码或备注"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button
            className="h-10 px-6 whitespace-nowrap"
            onClick={applySearch}
          >
            {labels.search}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {STATUSES.map((item) => (
          <Button key={item} size="sm" variant={status === item ? "default" : "outline"} onClick={() => setStatus(item)}>
            {labels.statuses[item]}
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Button className="shrink-0" variant="outline" onClick={exportCsv} disabled={isExporting}>
            {isExporting ? labels.exporting : labels.export}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm text-slate-600">
        <span>
          {labels.selected}: {selectedCodes.size}
        </span>
        <span className="text-xs text-slate-400">{labels.selectedHelp}</span>
        <Button size="sm" variant="outline" onClick={revokeSelected} disabled={isRevoking || selectedCodes.size === 0}>
          {isRevoking ? labels.revoking : labels.batchRevoke}
        </Button>
      </div>

      {message && <p className="text-sm text-rose-500">{message}</p>}

      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 rounded-lg px-4 py-3 text-sm shadow-lg ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div ref={tableRef} className="overflow-auto rounded-lg border border-slate-200 bg-white">
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
                <td className="p-3">
                  <StatusBadge
                    status={code.status}
                    label={labels.statusLabels[code.status] ?? labels.statusLabels.unknown}
                  />
                </td>
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

      <AlertDialog
        open={Boolean(confirmDialog)}
        title={confirmDialog?.type === "batch" ? labels.batchRevokeConfirmTitle : labels.revokeConfirmTitle}
        description={
          confirmDialog?.type === "batch" ? labels.batchRevokeConfirmDescription : labels.revokeConfirmDescription
        }
        confirmLabel={
          confirmDialog?.type === "batch" ? labels.batchRevokeConfirmAction : labels.revokeConfirmAction
        }
        cancelLabel={labels.confirmCancel}
        loadingLabel={labels.confirmProcessing}
        isLoading={isRevoking}
        onCancel={() => setConfirmDialog(null)}
        onConfirm={confirmDialog?.type === "batch" ? confirmRevokeBatch : confirmRevokeSingle}
      />
    </div>
  );
}
