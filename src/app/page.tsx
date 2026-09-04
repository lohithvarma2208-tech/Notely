import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { getConfigNumber } from "@/lib/config";
import WriterCard from "@/components/WriterCard";
import SampleCard from "@/components/SampleCard";
import SampleShowcase from "@/components/SampleShowcase";
import RotatingWord from "@/components/RotatingWord";
import RatingStars from "@/components/RatingStars";
import Avatar from "@/components/Avatar";
import {
  ArrowRight,
  NotebookPen,
  Search,
  ShieldCheck,
  Camera,
  MessageSquare,
  BadgeCheck,
  PenLine,
  UploadCloud,
  Wallet,
  FileText,
  Sparkles,
  Languages,
  Timer,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Decorative hero samples shown only while the platform has no real
 * handwriting samples yet. Generic study-note content — no fake people.
 */
const FALLBACK_SAMPLES = [
  {
    title: "Math notation",
    fontKey: "hand2",
    sampleText:
      "Module 2 — Linear Algebra\n\nTheorem: If A has n linearly independent eigenvectors, then A is diagonalizable.\n\nA = PDP⁻¹,  D = diag(λ₁, λ₂, …, λₙ)\n\n∫₀^π sin x dx = 2",
  },
  {
    title: "Physics notes",
    fontKey: "hand",
    sampleText:
      "Chapter 4 — Laws of Motion\n\nNewton's Second Law:\nF = dp/dt = ma (constant mass)\n\n• Friction: f ≤ μN\n• Inclined plane: a = g(sin θ − μ cos θ)",
  },
  {
    title: "Code notes",
    fontKey: "hand3",
    sampleText:
      "Recursion — notes\n\ndef fib(n):\n    if n <= 1:\n        return n\n    return fib(n-1) + fib(n-2)\n\n# Time: O(2^n)  Space: O(n) stack",
  },
];

export default async function LandingPage() {
  const [featured, samples, reviews, pagesAgg, completedOrders, ratedWriters, onTimeAgg, feePct] =
    await Promise.all([
      db.writerProfile.findMany({
        include: { user: true },
        orderBy: [{ ratingAvg: "desc" }, { jobsCompleted: "desc" }],
        take: 3,
      }),
      db.handwritingSample.findMany({
        include: { writer: { include: { user: true } } },
        orderBy: [{ writer: { ratingAvg: "desc" } }, { sortOrder: "asc" }],
        take: 6,
      }),
      db.review.findMany({
        include: { student: true, order: { include: { request: true } } },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      db.writerProfile.aggregate({ _sum: { totalPagesWritten: true } }),
      db.order.count({ where: { status: "COMPLETED" } }),
      db.writerProfile.findMany({
        where: { ratingCount: { gt: 0 } },
        select: { ratingAvg: true, ratingCount: true },
      }),
      db.writerProfile.aggregate({ _avg: { onTimePercent: true } }),
      getConfigNumber("platformFeePercent"),
    ]);

  // Real platform stats — shown only once real work has been completed.
  const totalPages = pagesAgg._sum.totalPagesWritten ?? 0;
  const totalRatings = ratedWriters.reduce((sum, w) => sum + w.ratingCount, 0);
  const avgRating =
    totalRatings > 0
      ? ratedWriters.reduce((sum, w) => sum + w.ratingAvg * w.ratingCount, 0) / totalRatings
      : null;
  const avgOnTime = onTimeAgg._avg.onTimePercent;

  const heroSamples = samples.length > 0 ? samples.slice(0, 3) : FALLBACK_SAMPLES;

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden border-b border-ink-100">
        {/* nature landscape backdrop */}
        <Image
          src="/bg-landscape.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center"
        />
        {/* theme-aware readability scrim */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-paper/90 via-paper/75 to-paper/90"
        />
        <div className="container-x relative py-20 text-center sm:py-28">
          <p className="animate-rise pill mx-auto mb-6 border border-accent-100 bg-accent-50 text-accent-700">
            <Sparkles size={13} /> The student note-writing marketplace
          </p>
          <h1 className="animate-rise-1 mx-auto max-w-3xl font-script text-6xl font-bold leading-[1.08] tracking-tight text-ink-900 sm:text-7xl">
            Your notes. Done{" "}
            <RotatingWord words={["neatly.", "quickly.", "beautifully.", "reliably."]} />
          </h1>
          <p className="animate-rise-2 mx-auto mt-6 max-w-2xl font-script text-2xl leading-relaxed text-ink-500">
            Missed a week of classes? Hire a trusted note writer to turn faculty
            PDFs and a friend&apos;s notebook photos into clean, exam-ready
            notes — while you spend your time actually learning.
          </p>
          <div className="animate-rise-3 mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/requests/new" className="btn-primary btn-lg">
              Post a note request <ArrowRight size={17} />
            </Link>
            <Link href="/find-work" className="btn-outline btn-lg">
              Earn as a note writer
            </Link>
          </div>

          {/* hero handwriting strip */}
          <div className="relative mx-auto mt-16 grid max-w-4xl gap-5 sm:grid-cols-3">
            {heroSamples.map((s, i) => (
              <div key={i} className={i === 1 ? "sm:-mt-4" : ""}>
                <SampleCard {...s} tilt={i === 1 ? 0 : i === 0 ? -1.2 : 1.2} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Stats strip (real aggregates, hidden until real work exists) ---------- */}
      {completedOrders > 0 && (
        <section className="border-b border-ink-100 bg-cream">
          <div className="container-x grid grid-cols-2 gap-8 py-10 text-center sm:grid-cols-4">
            {[
              [`${totalPages.toLocaleString("en-IN")}+`, "pages written"],
              [`${completedOrders.toLocaleString("en-IN")}+`, "jobs completed"],
              [avgRating !== null ? `${avgRating.toFixed(1)}★` : "—", "average rating"],
              [avgOnTime !== null ? `${Math.round(avgOnTime)}%` : "—", "on-time delivery"],
            ].map(([v, l]) => (
              <div key={l}>
                <p className="font-display text-3xl font-bold text-ink-900">{v}</p>
                <p className="mt-1 text-sm text-ink-500">{l}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- Features ---------- */}
      <section className="container-x py-24" id="features">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="eyebrow">Features</span>
          <h2 className="section-title">Everything a notes marketplace needs</h2>
          <p className="mt-4 text-ink-500">
            Built specifically for note writing — not a generic freelance site
            with a new label.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: PenLine,
              title: "Handwriting portfolios",
              body: "Preview a writer's actual handwriting — neat, fast, headings, diagrams, math notation — before you spend a rupee.",
            },
            {
              icon: UploadCloud,
              title: "Any source material",
              body: "Faculty PDFs, notebook photos, PPTs, DOCX — upload what you have and writers turn it into one clean set.",
            },
            {
              icon: Camera,
              title: "Page-by-page progress",
              body: "Writers post pages completed with photos as they go. 28 of 42 pages done? You see it, live.",
            },
            {
              icon: Wallet,
              title: "Payment held until approval",
              body: "Your money is funded when work starts but only released to the writer after you approve the delivered notes.",
            },
            {
              icon: MessageSquare,
              title: "Private order chat",
              body: "Every order gets its own conversation. Clarify requirements, share files, keep a record — all in one place.",
            },
            {
              icon: BadgeCheck,
              title: "Earned trust badges",
              body: "Identity Verified, 100+ Jobs, 1,000+ Pages, Top Rated — every badge is computed from real order history.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="card group p-7 transition-all hover:-translate-y-1 hover:shadow-lift"
            >
              <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 text-accent-600 transition-colors group-hover:bg-accent-600 group-hover:text-white">
                <f.icon size={22} />
              </span>
              <h3 className="font-display text-lg font-bold text-ink-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="border-y border-ink-100 bg-cream py-24" id="how-it-works">
        <div className="container-x grid items-center gap-14 lg:grid-cols-2">
          <div>
            <span className="eyebrow">How it works</span>
            <h2 className="section-title">
              From backlog to bound notes, in three steps
            </h2>
            <p className="mt-4 text-ink-500">
              You bring the source material. A note writer brings the
              handwriting. Your payment stays protected until you approve.
            </p>
            <ol className="mt-10 space-y-8">
              {[
                {
                  icon: NotebookPen,
                  title: "Post your requirement",
                  body: "Subject, page estimate, source files, handwriting style, notebook specs, deadline and budget. Two minutes, tops.",
                },
                {
                  icon: Search,
                  title: "Compare offers & samples",
                  body: "Writers bid with price and delivery time. Check handwriting samples, ratings and on-time records before you choose.",
                },
                {
                  icon: ShieldCheck,
                  title: "Track, review, approve",
                  body: "Watch page-by-page progress with photos. Release payment only when the notes are exactly what you asked for.",
                },
              ].map((s, i) => (
                <li key={s.title} className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-600 font-display text-base font-bold text-white">
                      {i + 1}
                    </span>
                    {i < 2 && <span className="mt-2 w-px flex-1 bg-accent-200" />}
                  </div>
                  <div className="pb-2">
                    <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink-900">
                      {s.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="card overflow-hidden">
            <div className="border-b border-ink-100 bg-ink-50/60 px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                Live order progress
              </p>
            </div>
            <div className="space-y-5 p-6">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink-900">Java — Module 2</span>
                  <span className="text-ink-400">31 / 45 pages</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-100">
                  <div className="h-full w-[69%] rounded-full bg-accent-600" />
                </div>
              </div>
              <div className="ruled-paper ruled-margin rounded-xl border border-[#e8e2d9] p-4 pl-11">
                <p className="font-hand2 text-lg leading-[28px] text-[#2b2a26]">
                  Completed pages 1–31. Collections framework done, starting
                  diagrams for the Map hierarchy now.
                </p>
                <p className="mt-2 text-xs text-[#8a8578]">Ananya · 2 hours ago</p>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-mint-50 px-4 py-3 text-sm">
                <span className="flex items-center gap-2 font-medium text-mint-700">
                  <ShieldCheck size={16} /> Payment protected
                </span>
                <span className="font-semibold text-mint-700">₹405 held</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Featured writers ---------- */}
      {featured.length > 0 && (
        <section className="container-x py-24" id="writers">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <span className="eyebrow">Note Writers</span>
              <h2 className="section-title">Meet the note writers</h2>
              <p className="mt-4 text-ink-500">
                Real people, real handwriting. Every profile shows verified stats
                — jobs completed, pages written, on-time record.
              </p>
            </div>
            <Link href="/writers" className="btn-outline btn-md">
              Browse all writers <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {featured.map((w) => (
              <WriterCard key={w.id} writer={w} />
            ))}
          </div>
        </section>
      )}

      {/* ---------- Handwriting gallery ---------- */}
      {samples.length > 0 && (
        <section className="border-y border-ink-100 bg-cream py-24" id="samples">
          <div className="container-x">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <span className="eyebrow">Handwriting gallery</span>
              <h2 className="section-title">See the handwriting before you hire</h2>
              <p className="mt-4 text-ink-500">
                Every sample is uploaded by a real note writer — find the style
                you like and hire that writer directly from their sample.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {samples.map((s) => (
                <SampleShowcase key={s.id} sample={s} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Reviews ---------- */}
      {reviews.length > 0 && (
        <section className="container-x py-24" id="reviews">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="eyebrow">Reviews</span>
            <h2 className="section-title">What students say</h2>
            <p className="mt-4 text-ink-500">
              Real reviews from completed orders — rated on handwriting, accuracy,
              neatness, communication and punctuality.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.id} className="card flex flex-col gap-4 p-7">
                <RatingStars value={r.overall} size={16} />
                <blockquote className="flex-1 text-[15px] leading-relaxed text-ink-700">
                  “{r.text}”
                </blockquote>
                <figcaption className="flex items-center gap-3 border-t border-ink-100 pt-4">
                  <Avatar name={r.student.name} size={38} />
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{r.student.name}</p>
                    <p className="text-xs text-ink-400">{r.order.request.title}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ---------- Pricing ---------- */}
      <section className="border-y border-ink-100 bg-cream py-24" id="pricing">
        <div className="container-x">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="eyebrow">Pricing</span>
            <h2 className="section-title">Simple, transparent pricing</h2>
            <p className="mt-4 text-ink-500">
              Writers set their own per-page rates. You compare offers and pick
              what fits — payment is only released when you approve the work.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {[
              {
                icon: PenLine,
                name: "Handwritten Notes",
                price: "₹5–10",
                unit: "per page",
                points: ["Neat to very-neat styles", "Notebook specs supported", "Scanned PDF delivery"],
              },
              {
                icon: FileText,
                name: "Digital Notes",
                price: "₹3–6",
                unit: "per page",
                points: ["Structured PDF / DOCX", "Revision-sheet formatting", "Faster turnaround"],
              },
              {
                icon: ShieldCheck,
                name: "Buyer Protection",
                price: `${feePct}%`,
                unit: "platform fee",
                points: ["Payment held until approval", "Revision requests included", "Refund on cancellation"],
                highlight: true,
              },
            ].map((p) => (
              <div
                key={p.name}
                className={`card flex flex-col p-7 ${p.highlight ? "border-accent-600 ring-1 ring-accent-600" : ""}`}
              >
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                  <p.icon size={19} />
                </span>
                <h3 className="font-display text-lg font-bold text-ink-900">{p.name}</h3>
                <p className="mt-2">
                  <span className="font-display text-3xl font-bold text-ink-900">{p.price}</span>{" "}
                  <span className="text-sm text-ink-400">{p.unit}</span>
                </p>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm text-ink-600">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-mint-500" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-ink-400">
            <Timer size={13} className="mr-1 inline" /> Typical turnaround: 1–3
            days for a 40-page module.
          </p>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="relative overflow-hidden py-20 text-white">
        <Image
          src="/bg-nebula.jpg"
          alt=""
          fill
          className="object-cover object-center"
        />
        <div aria-hidden className="absolute inset-0 bg-accent-700/75" />
        <div className="container-x relative text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium">
            <Languages size={14} /> English, Hindi, Telugu, Tamil & more
          </span>
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Stop copying. Start learning.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-accent-100">
            Post your first note request in two minutes — or turn your own neat
            handwriting into income.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/requests/new"
              className="btn btn-lg bg-white text-accent-700 hover:bg-accent-50"
            >
              Post a note request
            </Link>
            <Link
              href="/register?role=writer"
              className="btn btn-lg border border-white/40 text-white hover:bg-white/10"
            >
              Become a note writer
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
