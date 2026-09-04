import { HAND_FONTS, cn } from "@/lib/utils";

/**
 * The visually distinctive element of Notely: handwriting samples rendered
 * as notebook paper with real handwriting-style fonts.
 */
export default function SampleCard({
  title,
  fontKey,
  sampleText,
  tilt = 0,
  className,
}: {
  title: string;
  fontKey: string;
  sampleText: string;
  tilt?: number;
  className?: string;
}) {
  const font = HAND_FONTS[fontKey] ?? HAND_FONTS.hand;
  return (
    <figure
      className={cn(
        "ruled-paper ruled-margin group relative overflow-hidden rounded-xl border border-[#e8e2d9] shadow-card transition-transform duration-300 hover:-translate-y-1 hover:shadow-lift",
        className
      )}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div className="border-b border-[#e8e2d9]/80 bg-white/70 px-4 py-2 backdrop-blur-sm">
        <figcaption className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8578]">
          {title}
        </figcaption>
      </div>
      <pre
        className={cn(
          "whitespace-pre-wrap px-4 py-3 pl-11 text-[15px] leading-[28px] text-[#2b2a26]",
          font.className
        )}
        style={{ maxHeight: 240, overflow: "hidden" }}
      >
        {sampleText}
      </pre>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#fffefb] to-transparent" />
    </figure>
  );
}
