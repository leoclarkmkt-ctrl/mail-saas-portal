import { clsx } from "clsx";
import { CheckCircle2, HelpCircle, MinusCircle, XCircle } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  unused: "bg-slate-100 text-slate-600",
  used: "bg-emerald-100 text-emerald-700",
  revoked: "bg-rose-100 text-rose-700"
};

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  unused: MinusCircle,
  used: CheckCircle2,
  revoked: XCircle
};

type StatusBadgeProps = {
  status: string | null | undefined;
  label: string;
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const normalizedStatus = status ?? "";
  const classes = STATUS_STYLES[normalizedStatus] ?? "bg-slate-100 text-slate-600";
  const Icon = STATUS_ICONS[normalizedStatus] ?? HelpCircle;
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", classes)}>
      <Icon className="mr-1 h-3.5 w-3.5" />
      {label}
    </span>
  );
}
