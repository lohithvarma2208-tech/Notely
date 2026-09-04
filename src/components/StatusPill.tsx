import { ORDER_STATUS_META, type OrderStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

const TONES: Record<string, string> = {
  neutral: "bg-ink-100 text-ink-600",
  info: "bg-accent-50 text-accent-700",
  warn: "bg-amber-50 text-amber-700",
  good: "bg-mint-50 text-mint-700",
  bad: "bg-red-50 text-red-600",
};

export default function StatusPill({ status }: { status: string }) {
  const meta = ORDER_STATUS_META[status as OrderStatus] ?? {
    label: status,
    tone: "neutral" as const,
  };
  return <span className={cn("pill", TONES[meta.tone])}>{meta.label}</span>;
}
