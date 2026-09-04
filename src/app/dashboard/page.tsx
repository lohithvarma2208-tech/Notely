import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserWithProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import Avatar from "@/components/Avatar";
import ProgressBar from "@/components/ProgressBar";
import StatusPill from "@/components/StatusPill";
import EmptyState from "@/components/EmptyState";
import SubscriptionBanner from "@/components/SubscriptionBanner";
import SampleShowcase from "@/components/SampleShowcase";
import MarkRead from "./MarkRead";
import { cn, daysUntil, formatDate, inr, timeAgo } from "@/lib/utils";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  Eye,
  FileText,
  Inbox,
  IndianRupee,
  MessageSquare,
  NotebookPen,
  PenLine,
} from "lucide-react";

export const dynamic = "force-dynamic";

const ACTIVE_ORDER_STATUSES = [
  "FUNDED",
  "IN_PROGRESS",
  "READY_FOR_REVIEW",
  "REVISION_REQUESTED",
];

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Kolkata",
    }).format(new Date())
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Warm highlight when a deadline is today/tomorrow, red when overdue. */
function deadlineTone(deadline: Date): string {
  const days = Math.ceil((deadline.getTime() - Date.now()) / 86400000);
  if (days < 0) return "font-semibold text-red-600";
  if (days <= 1) return "font-semibold text-amber-600";
  return "text-ink-500";
}

const snippet = (s: string) =>
  s.length > 90 ? s.slice(0, 90).trimEnd() + "…" : s;

export default async function StudentDashboard() {
  const user = await getSessionUserWithProfile();
  if (!user) redirect("/login");

  const [
    openRequests,
    offersAgg,
    activeOrders,
    completedCount,
    spendingAgg,
    recentMessages,
    notifications,
    samples,
  ] = await Promise.all([
    db.noteRequest.findMany({
      where: { studentId: user.id, status: "OPEN" },
      orderBy: { createdAt: "desc" },
    }),
    db.noteRequest.aggregate({
      _sum: { offerCount: true },
      where: { studentId: user.id, status: "OPEN" },
    }),
    db.order.findMany({
      where: { studentId: user.id, status: { in: ACTIVE_ORDER_STATUSES } },
      include: { writer: true, request: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.order.count({
      where: { studentId: user.id, status: { in: ["APPROVED", "COMPLETED"] } },
    }),
    db.order.aggregate({
      _sum: { agreedPrice: true },
      where: { studentId: user.id, status: { not: "CANCELLED" } },
    }),
    db.message.findMany({
      where: { order: { studentId: user.id } },
      include: {
        sender: true,
        order: { select: { id: true, request: { select: { title: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.handwritingSample.findMany({
      include: { writer: { include: { user: true } } },
      orderBy: [{ writer: { ratingAvg: "desc" } }, { sortOrder: "asc" }],
      take: 4,
    }),
  ]);

  const offersReceived = offersAgg._sum.offerCount ?? 0;
  const totalSpending = spendingAgg._sum.agreedPrice ?? 0;
  const awaitingReview = activeOrders.filter(
    (o) => o.status === "READY_FOR_REVIEW"
  );
  const firstName = user.name.split(" ")[0];

  const stats = [
    { icon: FileText, label: "Active requests", value: String(openRequests.length) },
    { icon: Inbox, label: "Offers received", value: String(offersReceived) },
    { icon: NotebookPen, label: "Notes in progress", value: String(activeOrders.length) },
    { icon: Eye, label: "Awaiting review", value: String(awaitingReview.length) },
    { icon: CheckCircle2, label: "Completed", value: String(completedCount) },
    { icon: IndianRupee, label: "Total spending", value: inr(totalSpending) },
  ];

  return (
    <div className="container-x py-10 sm:py-12">
      <MarkRead />

      {/* ---------- Header ---------- */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-400">{formatDate(new Date())}</p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl">
            {greeting()},{" "}
            <span className="italic text-accent-700">{firstName}</span>
          </h1>
          <p className="mt-2 text-ink-500">
            Here&apos;s what&apos;s happening with your notes.
          </p>
        </div>
        <Link href="/requests/new" className="btn-primary btn-md">
          <NotebookPen size={16} /> Post a note request
        </Link>
      </div>

      {/* ---------- Subscription banner ---------- */}
      <SubscriptionBanner user={user} />

      {/* ---------- Writer banner ---------- */}
      {user.writerProfile && (
        <Link
          href="/dashboard/writer"
          className="card group mt-6 flex items-center justify-between gap-4 border-accent-100 bg-gradient-to-r from-accent-50 to-mint-50/50 p-4 transition-all hover:shadow-lift"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-accent-600 shadow-card">
              <PenLine size={18} />
            </span>
            <div>
              <p className="font-semibold text-ink-900">
                You also earn as a note writer
              </p>
              <p className="text-sm text-ink-500">
                Switch to your writer dashboard for jobs, progress and earnings.
              </p>
            </div>
          </div>
          <ArrowRight
            size={18}
            className="shrink-0 text-accent-600 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      )}

      {/* ---------- Stat strip ---------- */}
      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              <s.icon size={13} className="text-accent-600" />
              {s.label}
            </dt>
            <dd className="mt-1.5 font-display text-2xl font-semibold text-ink-950">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* ---------- Main column ---------- */}
        <div className="space-y-10">
          {/* Handwriting gallery — discover writers by their handwriting */}
          <section>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-950">
                  Handwriting gallery
                </h2>
                <p className="mt-1 text-sm text-ink-500">
                  Real samples from note writers — pick the handwriting you
                  like, then hire that writer.
                </p>
              </div>
              <Link
                href="/writers"
                className="flex shrink-0 items-center gap-1 text-sm font-medium text-accent-700 hover:text-accent-800"
              >
                All writers <ArrowUpRight size={14} />
              </Link>
            </div>
            {samples.length === 0 ? (
              <EmptyState
                icon={PenLine}
                title="Samples will appear here"
                body="As note writers upload their handwriting samples, you can preview them here and hire the writer whose style fits you best."
                ctaLabel="Browse note writers"
                ctaHref="/writers"
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {samples.map((s) => (
                  <SampleShowcase key={s.id} sample={s} />
                ))}
              </div>
            )}
          </section>

          {/* Active note requests */}
          <section>
            <div className="mb-4 flex items-end justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-950">
                Active note requests
              </h2>
              <Link
                href="/requests/new"
                className="flex items-center gap-1 text-sm font-medium text-accent-700 hover:text-accent-800"
              >
                New request <ArrowUpRight size={14} />
              </Link>
            </div>
            {openRequests.length === 0 ? (
              <EmptyState
                icon={NotebookPen}
                title="No active note requests"
                body="Post what notes you need — handwritten, digital, or photos cleaned up — and writers will send you offers."
                ctaLabel="Post your first note request"
                ctaHref="/requests/new"
              />
            ) : (
              <div className="space-y-3">
                {openRequests.map((r) => (
                  <Link
                    key={r.id}
                    href={`/requests/${r.id}`}
                    className="card group flex flex-col gap-3 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="pill bg-accent-50 text-accent-700">
                          {r.subject}
                        </span>
                        <span
                          className={cn(
                            "pill",
                            r.offerCount > 0
                              ? "bg-mint-50 text-mint-700"
                              : "bg-ink-50 text-ink-400"
                          )}
                        >
                          <Inbox size={11} />
                          {r.offerCount} {r.offerCount === 1 ? "offer" : "offers"}
                        </span>
                      </div>
                      <h3 className="mt-2 truncate font-display text-lg font-semibold text-ink-950 group-hover:text-accent-700">
                        {r.title}
                      </h3>
                      <p className="mt-1 text-sm text-ink-500">
                        {r.estPages ? `${r.estPages} pages est.` : "Pages unknown"}
                        {" · "}
                        <span className={deadlineTone(r.deadline)}>
                          due {daysUntil(r.deadline)}
                        </span>
                      </p>
                    </div>
                    <div className="shrink-0 sm:text-right">
                      <p className="font-semibold text-ink-950">
                        {inr(r.budgetMin)}–{inr(r.budgetMax)}
                      </p>
                      <p className="text-xs text-ink-400">budget</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Notes in progress */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight text-ink-950">
              Notes in progress
            </h2>
            {activeOrders.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Nothing being written yet"
                body="Once you accept an offer on one of your requests, you can track page-by-page progress here."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {activeOrders.map((o) => (
                  <div key={o.id} className="card flex flex-col gap-4 p-5">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <StatusPill status={o.status} />
                        <span
                          className={cn("text-xs", deadlineTone(o.deadline))}
                        >
                          due {daysUntil(o.deadline)}
                        </span>
                      </div>
                      <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-ink-950">
                        {o.request.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        name={o.writer.name}
                        url={o.writer.avatarUrl}
                        size={30}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink-900">
                          {o.writer.name}
                        </p>
                        <p className="text-xs text-ink-400">your note writer</p>
                      </div>
                    </div>
                    <ProgressBar done={o.pagesCompleted} total={o.totalPages} />
                    <Link
                      href={`/orders/${o.id}`}
                      className="btn-outline btn-sm mt-auto self-start"
                    >
                      View progress <ArrowRight size={13} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Awaiting review */}
          {awaitingReview.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight text-ink-950">
                Awaiting your review
              </h2>
              <div className="space-y-3">
                {awaitingReview.map((o) => (
                  <div
                    key={o.id}
                    className="card flex flex-col gap-3 border-amber-200 bg-amber-50/40 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3.5">
                      <Avatar
                        name={o.writer.name}
                        url={o.writer.avatarUrl}
                        size={40}
                      />
                      <div>
                        <h3 className="font-display text-lg font-semibold text-ink-950">
                          {o.request.title}
                        </h3>
                        <p className="text-sm text-ink-500">
                          {o.writer.name} submitted {o.totalPages} pages for
                          review
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/orders/${o.id}`}
                      className="btn-accent btn-sm shrink-0"
                    >
                      <CheckCircle2 size={14} /> Approve now
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ---------- Sidebar ---------- */}
        <div className="space-y-8">
          {/* Recent messages */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink-950">
              <MessageSquare size={18} className="text-accent-600" />
              Recent messages
            </h2>
            {recentMessages.length === 0 ? (
              <div className="card p-5 text-sm text-ink-500">
                No messages yet. Every order gets a private chat with your note
                writer.
              </div>
            ) : (
              <div className="card divide-y divide-ink-100">
                {recentMessages.map((m) => (
                  <Link
                    key={m.id}
                    href={`/orders/${m.order.id}`}
                    className="flex gap-3 p-4 transition-colors hover:bg-ink-50/60"
                  >
                    <Avatar
                      name={m.sender.name}
                      url={m.sender.avatarUrl}
                      size={34}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-ink-900">
                          {m.sender.name}
                        </p>
                        <span className="shrink-0 text-[11px] text-ink-400">
                          {timeAgo(m.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[13px] leading-snug text-ink-500">
                        {snippet(m.body)}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-ink-400">
                        {m.order.request.title}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Notifications */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink-950">
              <Bell size={18} className="text-accent-600" />
              Notifications
            </h2>
            {notifications.length === 0 ? (
              <div className="card p-5 text-sm text-ink-500">
                You&apos;re all caught up. New offers, progress updates and
                messages will show up here.
              </div>
            ) : (
              <div className="card divide-y divide-ink-100">
                {notifications.map((n) => {
                  const unread = n.readAt === null;
                  const inner = (
                    <div className="flex gap-3 p-4">
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                          unread ? "bg-accent-600" : "bg-ink-200"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm",
                              unread
                                ? "font-semibold text-ink-950"
                                : "font-medium text-ink-700"
                            )}
                          >
                            {n.title}
                          </p>
                          <span className="shrink-0 text-[11px] text-ink-400">
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>
                        {n.body && (
                          <p className="mt-0.5 text-[13px] leading-snug text-ink-500">
                            {snippet(n.body)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                  return n.link ? (
                    <Link
                      key={n.id}
                      href={n.link}
                      className={cn(
                        "block transition-colors hover:bg-ink-50/60",
                        unread && "bg-accent-50/50"
                      )}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div key={n.id} className={cn(unread && "bg-accent-50/50")}>
                      {inner}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
