"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RefreshButton({
  labels,
}: {
  labels: { refresh: string; refreshing: string };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      className="border-accent text-accent hover:bg-accent/10"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
    >
      {isPending ? labels.refreshing : labels.refresh}
    </Button>
  );
}

export function LogoutButton({
  lang,
  labels,
}: {
  lang: "en" | "zh";
  labels: { logout: string; loggingOut: string };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await fetch("/api/logout", { method: "POST" });

      // 保持语言回跳
      const destination = `/edu-mail/login?lang=${lang}`;
      router.push(destination);
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="border-slate-200 text-slate-600 hover:bg-slate-100"
      onClick={handleLogout}
      disabled={isPending}
    >
      {isPending ? labels.loggingOut : labels.logout}
    </Button>
  );
}
