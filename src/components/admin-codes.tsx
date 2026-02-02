"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminCodes() {
  const [codes, setCodes] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(10);
  const [prefix, setPrefix] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const load = () => {
    fetch("/api/admin/codes")
      .then((res) => res.json())
      .then((data) => setCodes(data.codes ?? []));
  };

  useEffect(() => {
    load();
  }, []);

  const generate = async () => {
    setMessage(null);
    const res = await fetch("/api/admin/codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity, prefix })
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

  const exportCsv = () => {
    const header = "code,status,created_at";
    const lines = codes.map((c) => `${c.code},${c.status},${c.created_at}`);
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
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
        <Input placeholder="Prefix" value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} />
        <Button onClick={generate}>Generate</Button>
        <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
      </div>
      {message && <p className="text-sm text-rose-500">{message}</p>}
      <div className="overflow-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Code</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((code) => (
              <tr key={code.code} className="border-t border-slate-100">
                <td className="p-3 font-mono text-xs">{code.code}</td>
                <td className="p-3">{code.status}</td>
                <td className="p-3">{code.created_at}</td>
                <td className="p-3">
                  {code.status === "unused" && (
                    <Button size="sm" variant="outline" onClick={() => revoke(code.code)}>
                      Revoke
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
