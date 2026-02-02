"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUSES = ["all", "unused", "used", "revoked"] as const;

type Status = (typeof STATUSES)[number];

type AdminCodesLabels = {
  prefix: string;
  note: string;
  generate: string;
  exportCsv: string;
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
  const [message, setMessage] = useState<string | null>(null);

  const load = () => {
    const query = status === "all" ? "" : `?status=${status}`;
    fetch(`/api/admin/codes${query}`)
      .then((res) => res.json())
      .then((data) => setCodes(data.codes ?? []));
  };

  useEffect(() => {
    load();
  }, [status]);

  const generate = async () => {
    setMessage(null);
    const res = await fetch("/api/admin/codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity, prefix, note })
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Failed");
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

  const exportCsv = async () => {
    const res = await fetch("/api/admin/codes?export=csv");
    const text = await res.text();
    const blob = new Blob([text], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "activation-codes.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
        <Input placeholder={labels.prefix} value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} />
        <Input placeholder={labels.note} value={note} onChange={(e) => setNote(e.target.value)} />
        <Button onClick={generate}>{labels.generate}</Button>
        <Button variant="outline" onClick={exportCsv}>{labels.exportCsv}</Button>
      </div>
      <div className="flex gap-2 text-sm">
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
      </div>
      {message && <p className="text-sm text-rose-500">{message}</p>}
      <div className="overflow-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
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
