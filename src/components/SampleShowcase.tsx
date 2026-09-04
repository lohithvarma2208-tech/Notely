import Link from "next/link";
import type { HandwritingSample, WriterProfile, User } from "@prisma/client";
import SampleCard from "./SampleCard";
import Avatar from "./Avatar";
import RatingStars from "./RatingStars";
import { inr } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

/**
 * A handwriting sample with the writer attached — lets students discover
 * writers through their handwriting and jump straight to their profile.
 */
export default function SampleShowcase({
  sample,
}: {
  sample: HandwritingSample & { writer: WriterProfile & { user: User } };
}) {
  const w = sample.writer;
  return (
    <div className="card group flex flex-col overflow-hidden p-3 transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <SampleCard
        title={sample.title}
        fontKey={sample.fontKey}
        sampleText={sample.sampleText}
        className="border-0 shadow-none"
      />
      <Link
        href={`/writers/${w.userId}`}
        className="mt-3 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-ink-50"
      >
        <Avatar name={w.user.name} url={w.user.avatarUrl} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-900 group-hover:text-accent-700">
            {w.user.name}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-400">
            <RatingStars value={w.ratingAvg} size={11} />
            <span>{w.ratingAvg > 0 ? w.ratingAvg.toFixed(1) : "New"}</span>
            <span>·</span>
            <span>{inr(w.pricePerPage)}/page</span>
          </div>
        </div>
        <ArrowUpRight
          size={16}
          className="shrink-0 text-ink-300 transition-colors group-hover:text-accent-600"
        />
      </Link>
    </div>
  );
}
