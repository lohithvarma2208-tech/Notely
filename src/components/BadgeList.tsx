import {
  ShieldCheck,
  Phone,
  Award,
  NotebookPen,
  Star,
  Zap,
  BadgeCheck,
} from "lucide-react";
import type { Badge } from "@/lib/badges";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof ShieldCheck> = {
  identity: ShieldCheck,
  phone: Phone,
  jobs100: Award,
  experienced: BadgeCheck,
  pages1000: NotebookPen,
  top: Star,
  fast: Zap,
};

export default function BadgeList({
  badges,
  size = "sm",
}: {
  badges: Badge[];
  size?: "sm" | "md";
}) {
  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => {
        const Icon = ICONS[b.key] ?? BadgeCheck;
        return (
          <span
            key={b.key}
            title={b.description}
            className={cn(
              "pill border border-mint-100 bg-mint-50 text-mint-700",
              size === "md" && "px-3 py-1 text-[13px]"
            )}
          >
            <Icon size={size === "sm" ? 12 : 14} />
            {b.label}
          </span>
        );
      })}
    </div>
  );
}
