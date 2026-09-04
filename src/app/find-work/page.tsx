import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { NOTE_TYPES, SUBJECTS } from "@/lib/constants";
import { cn, daysUntil, formatDate, inr, timeAgo } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";
import {
  ArrowRight,
  BriefcaseBusiness,
  Calendar,
  FileText,
  Paperclip,
  SearchX,
  SlidersHorizontal,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Find work" };

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "deadline", label: "Deadline — soonest" },
  { value: "budget", label: "Budget — highest" },
] as const;
type SortKey = (typeof SORTS)[number]["value"];

const DEADLINE_OPTIONS = [
  { value: "", label: "Any deadline" },
  { value: "3", label: "Due within 3 days" },
  { value: "7", label: "Due within a week" },
  { value: "14", label: "Due within 2 weeks" },
  { value: "30", label: "Due within a month" },
] as const;

function noteTypeLabel(v: string) {
  return NOTE_TYPES.find((t) => t.value === v)?.label ?? v;
}

/** "1 PDF + 2 images" style summary of attached source files. */
function summarizeSources(sources: { fileType: string }[]): string {
  if (sources.length === 0) return "No files attached";
  const counts = new Map<string, number>();
  for (const s of sources) counts.set(s.fileType, (counts.get(s.fileType) ?? 0) + 1);
  const LABELS: Record<string, [string, string]> = {
    PDF: ["PDF", "PDFs"],
    IMAGE: ["image", "images"],
    DOCX: ["DOCX", "DOCX files"],
    PPTX: ["PPTX", "PPTX files"],
    OTHER: ["file", "files"],
  };
  return Array.from(counts.entries())
    .map(([type, count]) => {
      const [one, many] = LABELS[type] ?? LABELS.OTHER;
      return count === 1 ? `1 ${one}` : `${count} ${many}`;
    })
    .join(" + ");
}

function daysLeft(d: Date) {
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

export default async function FindWorkPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const viewer = await getSessionUser();

  const subject = typeof searchParams.subject === "string" ? searchParams.subject : "";
  const noteType = typeof searchParams.noteType === "string" ? searchParams.noteType : "";
  const minBudgetRaw = typeof searchParams.minBudget === "string" ? searchParams.minBudget : "";
  const minBudget = Number(minBudgetRaw);
  const within = typeof searchParams.within === "string" ? searchParams.within : "";
  const sort: SortKey = SORTS.some((s) => s.value === searchParams.sort)
    ? (searchParams.sort as SortKey)
    : "newest";

  const where: Prisma.NoteRequestWhereInput = {
    status: "OPEN",
    ...(viewer ? { studentId: { not: viewer.id } } : {}),
    ...(subject ? { subject } : {}),
    ...(noteType ? { noteType } : {}),
    ...(Number.isFinite(minBudget) && minBudget > 0
      ? { budgetMax: { gte: Math.round(minBudget) } }
      : {}),
    ...(within && Number(within) > 0
      ? { deadline: { lte: new Date(Date.now() + Number(within) * 86400000) } }
      : {}),
  };

  const orderBy: Prisma.NoteRequestOrderByWithRelationInput =
    sort === "deadline"
      ? { deadline: "asc" }
      : sort === "budget"
        ? { budgetMax: "desc" }
        : { createdAt: "desc" };

  const requests = await db.noteRequest.findMany({
    where,
    include: { sources: true },
    orderBy,
    take: 60,
  });

  const hasFilters = Boolean(subject || noteType || minBudgetRaw || within || searchParams.sort);

  return (
    <div>
      {/* ---------- Header ---------- */}
      <section className="border-b border-ink-100 bg-cream/40">
        <div className="container-x py-12 sm:py-14">
          <p className="pill mb-4 bg-accent-50 text-accent-700">
            <BriefcaseBusiness size={13} /> For note writers
          </p>
          <h1 className="section-title">Find work</h1>
          <p className="mt-3 max-w-xl text-ink-500">
            New note requests from students, updated live. Pick one that matches
            your subjects and make your best offer.
          </p>
        </div>
      </section>

      <section className="container-x py-10">
        {/* ---------- Filters ---------- */}
        <form
          action="/find-work"
          method="get"
          className="card mb-8 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[1.1fr_1.2fr_0.7fr_0.9fr_0.9fr_auto]"
        >
          <div>
            <label htmlFor="subject" className="label">
              Subject
            </label>
            <select id="subject" name="subject" defaultValue={subject} className="input">
              <option value="">All subjects</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="noteType" className="label">
              Type of work
            </label>
            <select id="noteType" name="noteType" defaultValue={noteType} className="input">
              <option value="">All types</option>
              {NOTE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="minBudget" className="label">
              Budget at least
            </label>
            <input
              id="minBudget"
              name="minBudget"
              type="number"
              min={0}
              step={50}
              placeholder="₹ 0"
              defaultValue={minBudgetRaw}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="within" className="label">
              Deadline
            </label>
            <select id="within" name="within" defaultValue={within} className="input">
              {DEADLINE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sort" className="label">
              Sort by
            </label>
            <select id="sort" name="sort" defaultValue={sort} className="input">
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
            <button type="submit" className="btn-primary btn-md flex-1 lg:flex-none">
              <SlidersHorizontal size={14} /> Apply
            </button>
            {hasFilters && (
              <Link href="/find-work" className="btn-ghost btn-md">
                Reset
              </Link>
            )}
          </div>
        </form>

        {/* ---------- Results ---------- */}
        <p className="mb-5 text-sm text-ink-500">
          <span className="font-semibold text-ink-900">{requests.length}</span>{" "}
          open request{requests.length === 1 ? "" : "s"}
          {hasFilters ? " matching your filters" : " right now"}
        </p>

        {requests.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={hasFilters ? "No requests match those filters" : "No open requests right now"}
            body={
              hasFilters
                ? "Try widening the budget or deadline range — new requests from students come in every day."
                : "New note requests from students appear here as soon as they are posted. Check back soon."
            }
            ctaLabel={hasFilters ? "Clear filters" : undefined}
            ctaHref={hasFilters ? "/find-work" : undefined}
          />
        ) : (
          <div className="grid gap-4">
            {requests.map((r) => {
              const left = daysLeft(r.deadline);
              const urgency =
                left < 0
                  ? "text-red-600"
                  : left <= 1
                    ? "text-red-600"
                    : left <= 3
                      ? "text-amber-600"
                      : "text-ink-500";
              return (
                <article
                  key={r.id}
                  className="card flex flex-col gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift sm:p-6"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="pill bg-accent-50 text-accent-700">{r.subject}</span>
                    <span className="pill bg-ink-50 text-ink-600">
                      {noteTypeLabel(r.noteType)}
                    </span>
                    <span className="ml-auto text-xs text-ink-400">
                      posted {timeAgo(r.createdAt)}
                    </span>
                  </div>

                  <div>
                    <Link
                      href={`/requests/${r.id}`}
                      className="font-display text-xl font-semibold tracking-tight text-ink-950 hover:text-accent-700"
                    >
                      {r.title}
                    </Link>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
                      <span className="inline-flex items-center gap-1.5 text-ink-500">
                        <FileText size={14} className="text-ink-400" />
                        {r.pagesUnknown || !r.estPages ? "Pages TBD" : `~${r.estPages} pages`}
                      </span>
                      <span className={cn("inline-flex items-center gap-1.5", urgency)}>
                        <Calendar size={14} />
                        {formatDate(r.deadline)} · {daysUntil(r.deadline)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-ink-500">
                        <Paperclip size={14} className="text-ink-400" />
                        {summarizeSources(r.sources)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4">
                    <div>
                      <p className="text-lg font-bold text-ink-950">
                        {inr(r.budgetMin)}–{inr(r.budgetMax)}
                      </p>
                      <p className="text-xs text-ink-400">student&apos;s budget</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "pill",
                          r.offerCount > 0
                            ? "bg-amber-50 text-amber-700"
                            : "bg-mint-50 text-mint-700"
                        )}
                      >
                        {r.offerCount > 0
                          ? `${r.offerCount} offer${r.offerCount === 1 ? "" : "s"}`
                          : "No offers yet"}
                      </span>
                      <Link href={`/requests/${r.id}`} className="btn-primary btn-sm">
                        View Request <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
