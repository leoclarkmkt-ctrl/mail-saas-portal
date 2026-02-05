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
  redirectGuideIntro: string;
  redirectGuidePath: string;
  redirectGuideAdd: string;
  redirectGuideListTitle: string;
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
  env?: {
    ok?: boolean;
    missing?: string[];
  };
  supabase?: {
    ok?: boolean;
    authOk?: boolean;
    dbOk?: boolean;
    schemaHints?: string[];
  };
  mailcow?: {
    ok?: boolean;
    missing?: string[];
    error?: string;
  };
  auth_redirect_hint?: string;
  app_base_url?: string;
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

  const redirectConfigured = Boolean(data?.auth_redirect_hint);
  const redirectUrls = useMemo(() => {
    const appBaseUrl = data?.app_base_url || "APP_BASE_URL";
    return [`${appBaseUrl}/reset`];
  }, [data?.app_base_url]);

  const redirectHint = useMemo(() => {
    if (data?.auth_redirect_hint) return data.auth_redirect_hint;
    return [
      labels.redirectGuideIntro,
      labels.redirectGuidePath,
      labels.redirectGuideAdd,
      `${labels.redirectGuideListTitle}\n${redirectUrls.map((url) => `- ${url}`).join("\n")}`
    ].join("\n\n");
  }, [data?.auth_redirect_hint, labels.redirectGuideAdd, labels.redirectGuideIntro, labels.redirectGuideListTitle, labels.redirectGuidePath, redirectUrls]);

  const copyHint = async () => {
    await navigator.clipboard.writeText(redirectHint);
    setMessage(labels.copied);
  };

  if (!data) {
    return <p className="text-sm text-slate-500">{labels.loading}</p>;
  }

  // Back-compat: older /api/health returned `missing_env`; keep fallback for legacy deployments.
  const missingEnv = data?.missing_env ?? data?.env?.missing ?? [];
  const supabaseOk = Boolean(data?.supabase?.ok ?? data?.supabase?.dbOk);
  const schemaOk = Boolean(data?.supabase?.dbOk);

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
      {statusLine(redirectConfigured, labels.redirect, redirectConfigured ? data?.auth_redirect_hint : labels.redirectMissing)}

      {data.message && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
          {data.message}
        </div>
      )}

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        <p className="font-medium text-slate-700">{labels.redirectTitle}</p>
        <p className="mt-1 whitespace-pre-line">{redirectHint}</p>
        <Button size="sm" className="mt-2" onClick={copyHint}>
          {labels.redirectCopy}
        </Button>
        {message && <p className="mt-2 text-xs text-emerald-600">{message}</p>}
      </div>
    </div>
  );
}
