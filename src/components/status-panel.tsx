"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type StatusLabels = {
  env: string;
  envDetailPrefix: string;
  envOk: string;
  supabase: string;
  supabaseOk: string;
  supabaseFail: string;
  schema: string;
  schemaOk: string;
  schemaFail: string;
  redirect: string;
  redirectMissing: string;
  redirectTitle: string;
  redirectCopy: string;
  copied: string;
  loading: string;
};

const statusLine = (ok: boolean, label: string, detail?: string) => (
  <div className="flex items-start justify-between rounded-md border border-slate-200 bg-white p-3 text-sm">
    <div>
      <p className="font-medium text-slate-700">{label}</p>
      {detail && <p className="text-xs text-slate-500">{detail}</p>}
    </div>
    <span className={ok ? "text-emerald-600" : "text-rose-500"}>{ok ? "✅" : "⚠️"}</span>
  </div>
);

type HealthResponse = {
  ok?: boolean;
  missing_env?: string[];
  env?: Record<string, "present" | "missing">;
  checks?: {
    supabase?: {
      ok?: boolean;
      dbOk?: boolean;
    };
  };
  supabase?: {
    ok?: boolean;
    dbOk?: boolean;
  };
  auth_redirect_hint?: string;
  message?: string;
};

export function StatusPanel({ labels }: { labels: StatusLabels }) {
  const [data, setData] = useState<HealthResponse | null>(null);
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
    setMessage(labels.copied);
  };

  if (!data) {
    return <p className="text-sm text-slate-500">{labels.loading}</p>;
  }

  const envEntries = data?.env ? Object.entries(data.env) : [];
  // Back-compat: older /api/health returned `missing_env`; keep fallback for legacy deployments.
  const missingEnv =
    data?.missing_env ??
    envEntries.filter(([, status]) => status === "missing").map(([key]) => key) ??
    [];
  const supabaseChecks = data?.checks?.supabase ?? data?.supabase ?? {};
  const supabaseOk = Boolean(supabaseChecks.ok ?? supabaseChecks.dbOk);
  const schemaOk = Boolean(supabaseChecks.dbOk);

  return (
    <div className="space-y-4">
      {statusLine(
        missingEnv.length === 0,
        labels.env,
        missingEnv.length > 0
          ? `${labels.envDetailPrefix}${missingEnv.join(", ")}`
          : labels.envOk
      )}
      {statusLine(
        supabaseOk,
        labels.supabase,
        supabaseOk ? labels.supabaseOk : labels.supabaseFail
      )}
      {statusLine(
        schemaOk,
        labels.schema,
        schemaOk ? labels.schemaOk : labels.schemaFail
      )}
      {statusLine(Boolean(redirectHint), labels.redirect, redirectHint || labels.redirectMissing)}

      {data.message && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
          {data.message}
        </div>
      )}

      {redirectHint && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-medium text-slate-700">{labels.redirectTitle}</p>
          <p className="mt-1 whitespace-pre-line">{redirectHint}</p>
          <Button size="sm" className="mt-2" onClick={copyHint}>
            {labels.redirectCopy}
          </Button>
          {message && <p className="mt-2 text-xs text-emerald-600">{message}</p>}
        </div>
      )}
    </div>
  );
}
