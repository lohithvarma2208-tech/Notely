import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  MapPin,
  NotebookPen,
  PenLine,
  ShieldCheck,
} from "lucide-react";
import { db } from "@/lib/db";
import Avatar from "@/components/Avatar";
import RatingStars from "@/components/RatingStars";
import BadgeList from "@/components/BadgeList";
import SampleCard from "@/components/SampleCard";
import { computeBadges } from "@/lib/badges";
import { AVAILABILITY, SAMPLE_STYLES } from "@/lib/constants";
import { cn, formatDate, inr, splitList, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TILTS = [-1, 1.5, -0.5, 1, -1.5, 0.5];

const AVAIL_TONE: Record<string, string> = {
  AVAILABLE: "bg-mint-50 text-mint-700",
  BUSY: "bg-amber-50 text-amber-700",
  AWAY: "bg-ink-100 text-ink-500",
};

const SUB_RATINGS = [
  { key: "handwriting", label: "Handwriting" },
  { key: "accuracy", label: "Accuracy" },
  { key: "neatness", label: "Neatness" },
  { key: "communication", label: "Communication" },
  { key: "onTime", label: "On time" },
] as const;

function responseTime(mins: number): string {
  if (mins < 60) return `~${mins} min`;
  const h = Math.round(mins / 60);
  return `~${h} hr${h === 1 ? "" : "s"}`;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const writer = await db.writerProfile.findUnique({
    where: { userId: params.id },
    include: { user: true },
  });
  if (!writer) return { title: "Writer not found" };
  return {
    title: `${writer.user.name} — ${writer.title}`,
    description: `Hire ${writer.user.name} for note writing. ${writer.jobsCompleted} jobs completed, ${writer.ratingAvg.toFixed(1)}★ rating, ${inr(writer.pricePerPage)}/page.`,
  };
}

export default async function WriterProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const writer = await db.writerProfile.findUnique({
    where: { userId: params.id },
    include: {
      user: true,
      samples: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!writer) notFound();

  const reviews = await db.review.findMany({
    where: { writerId: params.id },
    include: {
      student: true,
      order: { include: { request: { select: { title: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const firstName = writer.user.name.split(" ")[0];
  const badges = computeBadges(writer);
  const subjects = splitList(writer.subjects);
  const styles = splitList(writer.handwritingStyles);
  const languages = splitList(writer.languages);
  const availability =
    AVAILABILITY.find((a) => a.value === writer.availability) ??
    AVAILABILITY[0];

  // Group handwriting samples by style, in the canonical SAMPLE_STYLES order,
  // and assign alternating scrapbook tilts across the whole portfolio.
  let tilt = 0;
  const withTilt = <T,>(items: T[]) =>
    items.map((item) => ({ item, tilt: TILTS[tilt++ % TILTS.length] }));
  const knownStyles = new Set<string>(SAMPLE_STYLES.map((s) => s.value));
  const portfolio: { label: string; samples: { item: (typeof writer.samples)[number]; tilt: number }[] }[] =
    SAMPLE_STYLES.map((s) => ({
      label: s.label as string,
      samples: withTilt(writer.samples.filter((x) => x.style === s.value)),
    })).filter((g) => g.samples.length > 0);
  const otherSamples = writer.samples.filter((x) => !knownStyles.has(x.style));
  if (otherSamples.length > 0)
    portfolio.push({ label: "More samples", samples: withTilt(otherSamples) });

  const stats = [
    { label: "Jobs completed", value: writer.jobsCompleted.toLocaleString("en-IN") },
    { label: "Pages written", value: writer.totalPagesWritten.toLocaleString("en-IN") },
    { label: "On-time", value: `${writer.onTimePercent}%` },
    { label: "Avg response", value: responseTime(writer.avgResponseMins) },
    { label: "Languages", value: languages.join(", ") || "—" },
  ];

  return (
    <div>
      {/* ---------- Header ---------- */}
      <section className="border-b border-ink-100 bg-cream/60">
        <div className="container-x py-10 sm:py-14">
          <Link
            href="/writers"
            className="btn-ghost btn-sm -ml-3 mb-6 text-ink-500"
          >
            <ArrowLeft size={14} /> All writers
          </Link>
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="shrink-0">
              <Avatar
                name={writer.user.name}
                url={writer.user.avatarUrl}
                size={88}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl">
                  {writer.user.name}
                </h1>
                <span
                  className={cn("pill", AVAIL_TONE[writer.availability] ?? AVAIL_TONE.AWAY)}
                >
                  {availability.label}
                </span>
              </div>
              <p className="mt-1.5 text-lg text-ink-500">{writer.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
                {writer.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {writer.location}
                  </span>
                )}
                <span>Joined {formatDate(writer.user.createdAt)}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <RatingStars value={writer.ratingAvg} size={18} />
                <span className="text-lg font-bold text-ink-950">
                  {writer.ratingAvg.toFixed(1)}
                </span>
                <span className="text-sm text-ink-400">
                  ({writer.ratingCount}{" "}
                  {writer.ratingCount === 1 ? "review" : "reviews"})
                </span>
              </div>
              <div className="mt-4">
                <BadgeList badges={badges} size="md" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Stats band ---------- */}
      <section className="container-x mt-8">
        <dl className="card grid grid-cols-2 divide-ink-100 sm:grid-cols-3 sm:divide-x lg:grid-cols-6">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col px-4 py-4 text-center">
              <dt className="order-2 mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                {s.label}
              </dt>
              <dd className="order-1 truncate font-display text-xl font-semibold text-ink-950">
                {s.value}
              </dd>
            </div>
          ))}
          <div className="flex items-center justify-center px-4 py-4">
            <span
              className={cn("pill", AVAIL_TONE[writer.availability] ?? AVAIL_TONE.AWAY)}
            >
              <Clock size={12} /> {availability.label}
            </span>
          </div>
        </dl>
      </section>

      {/* ---------- Body ---------- */}
      <div className="container-x mt-10 grid gap-10 pb-20 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-14">
          {/* About */}
          {writer.bio && (
            <section>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-950">
                About {firstName}
              </h2>
              <p className="mt-3 max-w-2xl leading-relaxed text-ink-600">
                {writer.bio}
              </p>
            </section>
          )}

          {/* Handwriting portfolio */}
          <section>
            <div className="mb-6 max-w-2xl">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
                Handwriting portfolio
              </h2>
              <p className="mt-2 text-sm text-ink-500">
                Real pages from {firstName}&apos;s notebook — this is exactly
                what your notes will look like.
              </p>
            </div>
            {portfolio.length === 0 ? (
              <div className="card flex items-center gap-3 px-5 py-6 text-sm text-ink-500">
                <NotebookPen size={18} className="text-ink-300" />
                {firstName} hasn&apos;t uploaded handwriting samples yet.
              </div>
            ) : (
              <div className="space-y-10">
                {portfolio.map((group) => (
                  <div key={group.label}>
                    <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-400">
                      <PenLine size={13} /> {group.label}
                    </p>
                    <div className="columns-1 gap-6 sm:columns-2">
                      {group.samples.map(({ item, tilt: t }) => (
                        <div key={item.id} className="mb-6 break-inside-avoid">
                          <SampleCard
                            title={item.title}
                            fontKey={item.fontKey}
                            sampleText={item.sampleText}
                            tilt={t}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Subjects & styles */}
          <section className="grid gap-6 sm:grid-cols-2">
            <div className="card p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                <BookOpen size={15} className="text-accent-600" /> Subjects
              </h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {subjects.length === 0 ? (
                  <span className="text-sm text-ink-400">Not specified</span>
                ) : (
                  subjects.map((s) => (
                    <span key={s} className="pill bg-accent-50 text-accent-700">
                      {s}
                    </span>
                  ))
                )}
              </div>
            </div>
            <div className="card p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                <PenLine size={15} className="text-mint-600" /> Handwriting styles
              </h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {styles.length === 0 ? (
                  <span className="text-sm text-ink-400">Not specified</span>
                ) : (
                  styles.map((s) => (
                    <span key={s} className="pill bg-mint-50 text-mint-700">
                      {s}
                    </span>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Reviews */}
          <section>
            <div className="mb-6 flex items-baseline gap-3">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
                Reviews
              </h2>
              <span className="text-sm text-ink-400">
                {writer.ratingCount}{" "}
                {writer.ratingCount === 1 ? "review" : "reviews"}
              </span>
            </div>
            {reviews.length === 0 ? (
              <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
                <NotebookPen size={22} className="text-ink-300" />
                <p className="text-sm text-ink-500">
                  No reviews yet — be the first to hire {firstName} for your
                  notes.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {reviews.map((r) => (
                  <li key={r.id} className="card p-5">
                    <div className="flex items-start gap-3.5">
                      <Avatar
                        name={r.student.name}
                        url={r.student.avatarUrl}
                        size={40}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          <p className="font-semibold text-ink-900">
                            {r.student.name}
                          </p>
                          <RatingStars value={r.overall} size={13} />
                          <span className="text-xs text-ink-400">
                            {timeAgo(r.createdAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-ink-400">
                          for &ldquo;{r.order.request.title}&rdquo;
                        </p>
                        {r.text && (
                          <p className="mt-3 text-sm leading-relaxed text-ink-700">
                            {r.text}
                          </p>
                        )}
                        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-5">
                          {SUB_RATINGS.map((sr) => (
                            <div
                              key={sr.key}
                              className="flex items-center justify-between gap-2 sm:flex-col sm:items-start sm:justify-start sm:gap-1"
                            >
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                                {sr.label}
                              </span>
                              <RatingStars value={r[sr.key]} size={11} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ---------- Pricing card ---------- */}
        <aside>
          <div className="card p-6 lg:sticky lg:top-6">
            <h3 className="font-display text-xl font-semibold text-ink-950">
              Pricing
            </h3>
            <dl className="mt-4 space-y-3.5 text-sm">
              {writer.acceptsHandwritten && (
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-500">Handwritten notes</dt>
                  <dd className="font-bold text-ink-950">
                    {inr(writer.pricePerPage)}
                    <span className="text-xs font-normal text-ink-400">/page</span>
                  </dd>
                </div>
              )}
              {writer.acceptsDigital && (
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-500">Digital notes</dt>
                  <dd className="font-bold text-ink-950">
                    {inr(writer.digitalPricePerPage)}
                    <span className="text-xs font-normal text-ink-400">/page</span>
                  </dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-3 border-t border-ink-100 pt-3.5">
                <dt className="text-ink-500">Typical turnaround</dt>
                <dd className="font-semibold text-ink-900">
                  ~{writer.turnaroundDays}{" "}
                  {writer.turnaroundDays === 1 ? "day" : "days"} / 40 pages
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-ink-500">Minimum order</dt>
                <dd className="font-semibold text-ink-900">
                  {inr(writer.minOrderValue)}
                </dd>
              </div>
            </dl>
            <Link
              href="/requests/new"
              className="btn-accent btn-lg mt-6 w-full"
            >
              Request notes from {firstName}
            </Link>
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-400">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-mint-600" />
              Your payment is held safely by Notely and released only after you
              approve the delivered notes.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
