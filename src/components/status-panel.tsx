"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

const statusLine = (ok: boolean, label: string, detail?: string) => (
  <div className="flex items-start justify-between rounded-md border border-slate-200 bg-white p-3 text-sm">
    <div>
      <p className="font-medium text-slate-700">{label}</p>
      {detail && <p className="text-xs text-slate-500">{detail}</p>}
    </div>
    <span className={ok ? "text-emerald-600" : "text-rose-500"}>{ok ? "✅" : "⚠️"}</span>
  </div>
);

type HealthPayload = {
  ok: boolean;
  missing_env: string[];
  supabase: string;
  schema: string;
  auth_redirect_hint?: string;
  message?: string;
};

export function StatusPanel() {
  const [data, setData] = useState<HealthPayload | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const redirectHint = useMemo(() => {
    if (!data?.auth_redirect_hint) return "";
    return data.auth_redirect_hint;
  }, [data]);

  const copyHint = async () => {
    if (!redirectHint) return;
    await navigator.clipboard.writeText(redirectHint);
    setMessage("Copied");
  };

  if (!data) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  return (
    <div className="space-y-4">
      {statusLine(data.missing_env.length === 0, "环境变量是否齐全", data.missing_env.length > 0 ? `缺失: ${data.missing_env.join(", ")}` : "已配置")}
      {statusLine(data.supabase === "ok", "Supabase 是否可连接", data.supabase === "ok" ? "连接正常" : "连接失败" )}
      {statusLine(data.schema === "ok", "数据库 Schema 是否已初始化", data.schema === "ok" ? "已初始化" : "请在 Supabase SQL Editor 执行 schema.sql + seed.sql")}
      {statusLine(Boolean(redirectHint), "Auth Redirect URLs 是否已配置", redirectHint || "未提供提示")}

      {data.message && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
          {data.message}
        </div>
      )}

      {redirectHint && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-medium text-slate-700">建议配置</p>
          <p className="mt-1 whitespace-pre-line">{redirectHint}</p>
          <Button size="sm" className="mt-2" onClick={copyHint}>
            一键复制建议配置
          </Button>
          {message && <p className="mt-2 text-xs text-emerald-600">{message}</p>}
        </div>
      )}
    </div>
  );
}
