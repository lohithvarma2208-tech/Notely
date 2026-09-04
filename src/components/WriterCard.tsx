import Link from "next/link";
import type { WriterProfile, User } from "@prisma/client";
import Avatar from "./Avatar";
import RatingStars from "./RatingStars";
import BadgeList from "./BadgeList";
import { computeBadges } from "@/lib/badges";
import { inr, splitList } from "@/lib/utils";
import { Clock, FileText, CheckCircle2 } from "lucide-react";

export default function WriterCard({
  writer,
}: {
  writer: WriterProfile & { user: User };
}) {
  const badges = computeBadges(writer);
  const subjects = splitList(writer.subjects).slice(0, 3);
  const more = splitList(writer.subjects).length - subjects.length;

  return (
    <Link
      href={`/writers/${writer.userId}`}
      className="card group flex flex-col gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="flex items-start gap-3.5">
        <Avatar name={writer.user.name} url={writer.user.avatarUrl} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-display text-lg font-semibold text-ink-950 group-hover:text-accent-700">
              {writer.user.name}
            </h3>
          </div>
          <p className="truncate text-sm text-ink-500">{writer.title}</p>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <RatingStars value={writer.ratingAvg} />
            <span className="font-semibold text-ink-800">
              {writer.ratingAvg.toFixed(1)}
            </span>
            <span className="text-ink-400">({writer.ratingCount})</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-ink-950">
            {inr(writer.pricePerPage)}
            <span className="text-xs font-normal text-ink-400">/page</span>
          </p>
          <p className="text-[11px] text-ink-400">
            digital {inr(writer.digitalPricePerPage)}/page
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-xl bg-ink-50/70 px-3 py-2.5 text-center">
        <div>
          <p className="flex items-center justify-center gap-1 text-sm font-bold text-ink-900">
            <CheckCircle2 size={13} className="text-mint-600" />
            {writer.jobsCompleted}
          </p>
          <p className="text-[11px] text-ink-400">jobs done</p>
        </div>
        <div>
          <p className="flex items-center justify-center gap-1 text-sm font-bold text-ink-900">
            <FileText size={13} className="text-accent-600" />
            {writer.totalPagesWritten.toLocaleString("en-IN")}+
          </p>
          <p className="text-[11px] text-ink-400">pages written</p>
        </div>
        <div>
          <p className="flex items-center justify-center gap-1 text-sm font-bold text-ink-900">
            <Clock size={13} className="text-amber-500" />
            {writer.onTimePercent}%
          </p>
          <p className="text-[11px] text-ink-400">on-time</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {subjects.map((s) => (
          <span key={s} className="pill bg-ink-50 text-ink-600">
            {s}
          </span>
        ))}
        {more > 0 && (
          <span className="pill bg-ink-50 text-ink-400">+{more} more</span>
        )}
      </div>

      <BadgeList badges={badges.slice(0, 3)} />
    </Link>
  );
}
