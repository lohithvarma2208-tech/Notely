import type { Metadata } from "next";
import type { Prisma, User, WriterProfile } from "@prisma/client";
import { SearchX } from "lucide-react";
import { db } from "@/lib/db";
import WriterCard from "@/components/WriterCard";
import EmptyState from "@/components/EmptyState";
import WriterFilters, {
  type WriterFilterValues,
} from "./WriterFilters";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Find your note writer",
  description:
    "Browse verified note writers — compare real handwriting samples, ratings, prices and on-time records before you hire.",
};

type SearchParams = { [key: string]: string | string[] | undefined };
type WriterWithUser = WriterProfile & { user: User };

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

function positiveInt(v: string): number | null {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function positiveFloat(v: string): number | null {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function recommendedScore(w: WriterProfile): number {
  return w.ratingAvg * Math.log(w.jobsCompleted + 1);
}

function sortWriters(writers: WriterWithUser[], sort: string): WriterWithUser[] {
  const arr = [...writers];
  switch (sort) {
    case "top_rated":
      arr.sort((a, b) => b.ratingAvg - a.ratingAvg || b.ratingCount - a.ratingCount);
      break;
    case "experienced":
      arr.sort((a, b) => b.jobsCompleted - a.jobsCompleted);
      break;
    case "price_low":
      arr.sort((a, b) => a.pricePerPage - b.pricePerPage);
      break;
    case "fastest":
      arr.sort((a, b) => a.turnaroundDays - b.turnaroundDays);
      break;
    case "newest":
      arr.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      break;
    default:
      arr.sort(
        (a, b) =>
          recommendedScore(b) - recommendedScore(a) ||
          b.jobsCompleted - a.jobsCompleted
      );
  }
  return arr;
}

export default async function WritersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const current: WriterFilterValues = {
    q: first(searchParams.q).trim(),
    subject: first(searchParams.subject),
    language: first(searchParams.language),
    style: first(searchParams.style),
    availability: first(searchParams.availability),
    maxPrice: first(searchParams.maxPrice),
    minRating: first(searchParams.minRating),
    mode: first(searchParams.mode),
    verified: first(searchParams.verified),
    sort: first(searchParams.sort) || "recommended",
  };

  const where: Prisma.WriterProfileWhereInput = {};
  if (current.q) {
    where.OR = [
      { user: { name: { contains: current.q } } },
      { title: { contains: current.q } },
      { bio: { contains: current.q } },
      { subjects: { contains: current.q } },
    ];
  }
  if (current.subject) where.subjects = { contains: current.subject };
  if (current.language) where.languages = { contains: current.language };
  if (current.style) where.handwritingStyles = { contains: current.style };
  if (current.availability) where.availability = current.availability;
  const maxPrice = positiveInt(current.maxPrice);
  if (maxPrice) where.pricePerPage = { lte: maxPrice };
  const minRating = positiveFloat(current.minRating);
  if (minRating) where.ratingAvg = { gte: minRating };
  if (current.verified) where.identityVerified = true;
  if (current.mode === "digital") where.acceptsDigital = true;
  if (current.mode === "handwritten") where.acceptsHandwritten = true;

  const matches = await db.writerProfile.findMany({
    where,
    include: { user: true },
  });
  const writers = sortWriters(matches, current.sort);

  return (
    <div>
      <section className="border-b border-ink-100 bg-cream/60">
        <div className="container-x pb-20 pt-14 sm:pt-20">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl">
            Find your <span className="italic text-accent-700">note writer</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-500">
            Compare verified stats, real handwriting samples and honest reviews
            — then hire the writer whose notes you&apos;ll actually want to
            study from.
          </p>
        </div>
      </section>

      <WriterFilters current={current} count={writers.length}>
        {writers.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No writers match those filters"
            body="Try widening the price range, picking a different subject, or clearing the search."
            ctaLabel="Clear all filters"
            ctaHref="/writers"
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {writers.map((w) => (
              <WriterCard key={w.id} writer={w} />
            ))}
          </div>
        )}
      </WriterFilters>
    </div>
  );
}
