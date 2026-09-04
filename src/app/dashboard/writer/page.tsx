import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserWithProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import Avatar from "@/components/Avatar";
import ProgressBar from "@/components/ProgressBar";
import StatusPill from "@/components/StatusPill";
import RatingStars from "@/components/RatingStars";
import EmptyState from "@/components/EmptyState";
import SubscriptionBanner from "@/components/SubscriptionBanner";
import { cn, daysUntil, inr } from "@/lib/utils";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  FileText,
  Inbox,
  NotebookPen,
  PenLine,
  Star,
  Wallet,
} from "lucide-react";

export const dynamic = "force-dynamic";

const ACTIVE_JOB_STATUSES = [
  "FUNDED",
  "IN_PROGRESS",
  "READY_FOR_REVIEW",
  "REVISION_REQUESTED",
];

const NEXT_ACTION: Record<string, string> = {
  FUNDED: "Start writing",
  IN_PROGRESS: "Update progress",
  REVISION_REQUESTED: "Revise & resubmit",
  READY_FOR_REVIEW: "Waiting for student approval",
};

/** Warm highlight when a deadline is today/tomorrow, red when overdue. */
function deadlineTone(deadline: Date): string {
  const days = Math.ceil((deadline.getTime() - Date.now()) / 86400000);
  if (days < 0) return "font-semibold text-red-600";
  if (days <= 1) return "font-semibold text-amber-600";
  return "text-ink-500";
}

export default async function WriterDashboard() {
  const user = await getSessionUserWithProfile();
  if (!user) redirect("/login");
  const profile = user.writerProfile;
  if (!profile) redirect("/settings/writer");

  const [
    availableCount,
    availableJobs,
    activeJobs,
    pendingAgg,
    earnedAgg,
  ] = await Promise.all([
    db.noteRequest.count({
      where: { status: "OPEN", studentId: { not: user.id } },
    }),
    db.noteRequest.findMany({
      where: { status: "OPEN", studentId: { not: user.id } },
      include: { student: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    db.order.findMany({
      where: { writerId: user.id, status: { in: ACTIVE_JOB_STATUSES } },
      include: { student: true, request: true },
      orderBy: { deadline: "asc" },
    }),
    db.transaction.aggregate({
      _sum: { amount: true },
      where: { writerId: user.id, status: "PENDING" },
    }),
    db.transaction.aggregate({
      _sum: { amount: true },
      where: { writerId: user.id, status: { in: ["ELIGIBLE", "PAID"] } },
    }),
  ]);

  const inProgress = activeJobs.filter((o) => o.status === "IN_PROGRESS");
  const pagesRemaining = inProgress.reduce(
    (sum, o) => sum + Math.max(0, o.totalPages - o.pagesCompleted),
    0
  );
  const pendingEarnings = pendingAgg._sum.amount ?? 0;
  const totalEarnings = earnedAgg._sum.amount ?? 0;

  const stats = [
    { icon: Briefcase, label: "Available jobs", value: String(availableCount) },
    { icon: NotebookPen, label: "Active jobs", value: String(activeJobs.length) },
    { icon: FileText, label: "Pages to write", value: String(pagesRemaining) },
    { icon: Wallet, label: "Pending earnings", value: inr(pendingEarnings) },
    { icon: Inbox, label: "Total earnings", value: inr(totalEarnings) },
    {
      icon: Star,
      label: "Rating",
      value: profile.ratingCount > 0 ? profile.ratingAvg.toFixed(1) : "—",
    },
  ];

  return (
    <div className="container-x py-10 sm:py-12">
      {/* ---------- Header ---------- */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="pill bg-mint-50 text-mint-700">
            <PenLine size={12} /> Note writer
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl">
            Writer <span className="italic text-accent-700">dashboard</span>
          </h1>
          <p className="mt-2 text-ink-500">
            {profile.title} · {profile.jobsCompleted} jobs completed
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/earnings" className="btn-outline btn-md">
            <Wallet size={16} /> View earnings
          </Link>
          <Link href="/find-work" className="btn-primary btn-md">
            <Briefcase size={16} /> Find work
          </Link>
        </div>
      </div>

      {/* ---------- Subscription banner ---------- */}
      <SubscriptionBanner user={user} />

      {/* ---------- Today card ---------- */}
      <div className="card mt-8 overflow-hidden">
        <div className="border-b border-ink-100 bg-ink-950 px-6 py-5 text-paper">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-300">
            Today
          </p>
          <p className="mt-1 font-display text-2xl font-semibold sm:text-3xl">
            {pagesRemaining > 0 ? (
              <>
                You have{" "}
                <span className="italic text-accent-300">{pagesRemaining} pages</span>{" "}
                remaining today
              </>
            ) : (
              "No pages pending — pick up a new job below"
            )}
          </p>
        </div>
        {inProgress.length > 0 && (
          <ul className="divide-y divide-ink-100">
            {inProgress.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between gap-3 px-6 py-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">
                    {o.request.title}
                  </p>
                  <p className={cn("text-xs", deadlineTone(o.deadline))}>
                    due {daysUntil(o.deadline)}
                  </p>
                </div>
                <span className="pill shrink-0 bg-accent-50 text-accent-700">
                  {Math.max(0, o.totalPages - o.pagesCompleted)} pages left
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ---------- Stat strip ---------- */}
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              <s.icon size={13} className="text-accent-600" />
              {s.label}
            </dt>
            <dd className="mt-1.5 font-display text-2xl font-semibold text-ink-950">
              {s.value}
            </dd>
            {s.label === "Rating" && profile.ratingCount > 0 && (
              <dd className="mt-1">
                <RatingStars value={profile.ratingAvg} size={12} />
              </dd>
            )}
          </div>
        ))}
      </dl>

      {/* ---------- Available jobs ---------- */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-950">
              Available jobs
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Open note requests from students — send an offer before someone
              else does.
            </p>
          </div>
          <Link
            href="/find-work"
            className="flex shrink-0 items-center gap-1 text-sm font-medium text-accent-700 hover:text-accent-800"
          >
            Browse all jobs <ArrowUpRight size={14} />
          </Link>
        </div>
        {availableJobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No open jobs right now"
            body="New note requests from students appear here as they are posted. Check back soon."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {availableJobs.map((r) => (
              <div
                key={r.id}
                className="card flex flex-col gap-3 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="pill bg-accent-50 text-accent-700">
                    {r.subject}
                  </span>
                  <span className="pill bg-ink-50 text-ink-500">
                    <Inbox size={11} /> {r.offerCount}{" "}
                    {r.offerCount === 1 ? "offer" : "offers"} so far
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold leading-snug text-ink-950">
                  {r.title}
                </h3>
                <p className="text-sm text-ink-500">
                  {r.estPages ? `${r.estPages} pages est.` : "Pages unknown"}
                  {" · "}
                  <span className={deadlineTone(r.deadline)}>
                    due {daysUntil(r.deadline)}
                  </span>
                  {" · "}by {r.student.name.split(" ")[0]}
                </p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                  <p className="font-semibold text-ink-950">
                    {inr(r.budgetMin)}–{inr(r.budgetMax)}
                  </p>
                  <Link
                    href={`/requests/${r.id}`}
                    className="btn-primary btn-sm"
                  >
                    View <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Active jobs ---------- */}
      <section className="mt-10">
        <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight text-ink-950">
          Your active jobs
        </h2>
        {activeJobs.length === 0 ? (
          <EmptyState
            icon={NotebookPen}
            title="No active jobs"
            body="When a student accepts your offer, the job lands here with page tracking and a private chat."
            ctaLabel="Find note-writing jobs"
            ctaHref="/find-work"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {activeJobs.map((o) => (
              <div key={o.id} className="card flex flex-col gap-4 p-5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <StatusPill status={o.status} />
                    <span className={cn("text-xs", deadlineTone(o.deadline))}>
                      due {daysUntil(o.deadline)}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-ink-950">
                    {o.request.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2.5">
                  <Avatar
                    name={o.student.name}
                    url={o.student.avatarUrl}
                    size={30}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">
                      {o.student.name}
                    </p>
                    <p className="text-xs text-ink-400">student</p>
                  </div>
                  <p className="ml-auto text-sm font-semibold text-ink-900">
                    {inr(o.writerEarning)}
                  </p>
                </div>
                <ProgressBar done={o.pagesCompleted} total={o.totalPages} />
                <div className="mt-auto flex items-center justify-between gap-3">
                  <span
                    className={cn(
                      "pill",
                      o.status === "READY_FOR_REVIEW"
                        ? "bg-ink-50 text-ink-500"
                        : "bg-mint-50 text-mint-700"
                    )}
                  >
                    {NEXT_ACTION[o.status] ?? "View job"}
                  </span>
                  <Link
                    href={`/orders/${o.id}`}
                    className="btn-outline btn-sm"
                  >
                    Open job <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
