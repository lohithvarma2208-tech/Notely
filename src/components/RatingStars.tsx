import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RatingStars({
  value,
  size = 14,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "fill-ink-100 text-ink-100"
          }
        />
      ))}
    </span>
  );
}
