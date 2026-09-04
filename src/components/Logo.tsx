import Image from "next/image";
import { cn } from "@/lib/utils";

/** Notely logo mark — the pen-and-pages tile from /public/logo.png. */
export function LogoMark({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/logo.png"
      alt="Notely logo"
      width={size}
      height={size}
      priority
      className={cn("shrink-0 rounded-[22%]", className)}
      style={{ width: size, height: size }}
    />
  );
}

/** Mark + wordmark, as used in the navbar and footer. */
export default function Logo({
  size = 36,
  withWordmark = true,
  wordmarkClassName,
}: {
  size?: number;
  withWordmark?: boolean;
  wordmarkClassName?: string;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} />
      {withWordmark && (
        <span
          className={cn(
            "font-display text-[22px] font-bold tracking-tight text-ink-900",
            wordmarkClassName
          )}
        >
          Notely
        </span>
      )}
    </span>
  );
}
