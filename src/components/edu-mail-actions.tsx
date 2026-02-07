"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RefreshButton() {
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
      {isPending ? "Refreshing..." : "刷新邮件"}
    </Button>
  );
}

export function LogoutButton({ lang }: { lang: "en" | "zh" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await fetch("/api/logout", { method: "POST" });
      const separator = "/edu-mail/login".includes("?") ? "&" : "?";
      const destination = `${"/edu-mail/login"}${separator}lang=${lang}`;
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
      {isPending ? "Signing Out..." : "登出"}
    </Button>
  );
}
