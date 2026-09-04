import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export default function EmptyState({
  icon: Icon,
  title,
  body,
  ctaLabel,
  ctaHref,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-50 text-ink-400">
        <Icon size={22} />
      </span>
      <h3 className="font-display text-lg font-semibold text-ink-900">{title}</h3>
      <p className="max-w-sm text-sm text-ink-500">{body}</p>
      {ctaLabel && ctaHref && (
        <Link href={ctaHref} className="btn-primary btn-md mt-2">
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
