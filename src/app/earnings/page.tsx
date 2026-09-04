import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserWithProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import EmptyState from "@/components/EmptyState";
import { cn, formatDate, inr } from "@/lib/utils";
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  ShieldCheck,
  Wallet,
} from "lucide-react";

export const dynamic = "force-dynamic";

const TX_STATUS_META: Record<string, { label: string; tone: string }> = {
  PENDING: { label: "Pending", tone: "bg-amber-50 text-amber-700" },
  ELIGIBLE: { label: "Eligible", tone: "bg-accent-50 text-accent-700" },
  PAID: { label: "Paid out", tone: "bg-mint-50 text-mint-700" },
};

function feePctLabel(pct: number): string {
  return `${Number.isInteger(pct) ? pct.toFixed(0) : pct.toFixed(1)}%`;
}

export default async function EarningsPage() {
  const user = await getSessionUserWithProfile();
  if (!user) redirect("/login");
  if (!user.writerProfile) redirect("/settings/writer");

  const [pendingAgg, eligibleAgg, totalAgg, transactions] = await Promise.all([
    db.transaction.aggregate({
      _sum: { amount: true },
      where: { writerId: user.id, status: "PENDING" },
    }),
    db.transaction.aggregate({
      _sum: { amount: true },
      where: { writerId: user.id, status: "ELIGIBLE" },
    }),
    db.transaction.aggregate({
      _sum: { amount: true },
      where: { writerId: user.id, status: { in: ["ELIGIBLE", "PAID"] } },
    }),
    db.transaction.findMany({
      where: { writerId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Transaction has no Prisma relation to Order — fetch the linked orders
  // (with their request titles and fee snapshots) in one query and join by id.
  const orderIds = transactions
    .map((t) => t.orderId)
    .filter((id): id is string => id !== null);
  const orders = await db.order.findMany({
    where: { id: { in: orderIds } },
    include: { request: { select: { title: true } } },
  });
  const orderById = new Map(orders.map((o) => [o.id, o]));

  const stats = [
    {
      icon: Clock,
      label: "Pending earnings",
      value: inr(pendingAgg._sum.amount ?? 0),
      hint: "Held while you write",
    },
    {
      icon: BadgeCheck,
      label: "Eligible for payout",
      value: inr(eligibleAgg._sum.amount ?? 0),
      hint: "Approved by students",
    },
    {
      icon: Wallet,
      label: "Total earned",
      value: inr(totalAgg._sum.amount ?? 0),
      hint: "Eligible + paid out",
    },
  ];

  return (
    <div className="container-x py-10 sm:py-12">
      {/* ---------- Header ---------- */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/dashboard/writer"
            className="flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-800"
          >
            <ArrowLeft size={14} /> Writer dashboard
          </Link>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl">
            Your <span className="italic text-accent-700">earnings</span>
          </h1>
          <p className="mt-2 text-ink-500">
            Every rupee from your note-writing jobs, tracked per order.
          </p>
        </div>
        <Link href="/find-work" className="btn-primary btn-md">
          Find more jobs
        </Link>
      </div>

      {/* ---------- Stat cards ---------- */}
      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-6">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                <s.icon size={15} />
              </span>
              {s.label}
            </dt>
            <dd className="mt-3 font-display text-3xl font-semibold text-ink-950">
              {s.value}
            </dd>
            <dd className="mt-1 text-xs text-ink-400">{s.hint}</dd>
          </div>
        ))}
      </dl>

      {/* ---------- Transaction history ---------- */}
      <section className="mt-10">
        <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight text-ink-950">
          Transaction history
        </h2>
        {transactions.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No earnings yet"
            body="Accept a note-writing job and deliver it — your earnings will appear here as soon as the order is funded."
            ctaLabel="Find note-writing jobs"
            ctaHref="/find-work"
          />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3.5">Order</th>
                  <th className="px-4 py-3.5 text-right">Agreed price</th>
                  <th className="px-4 py-3.5 text-right">Platform fee</th>
                  <th className="px-4 py-3.5 text-right">You earn</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {transactions.map((t) => {
                  const order = t.orderId ? orderById.get(t.orderId) : undefined;
                  const meta = TX_STATUS_META[t.status] ?? {
                    label: t.status,
                    tone: "bg-ink-100 text-ink-600",
                  };
                  return (
                    <tr key={t.id} className="transition-colors hover:bg-ink-50/50">
                      <td className="px-5 py-4">
                        {order ? (
                          <>
                            <p className="font-medium text-ink-900">
                              {order.request.title}
                            </p>
                            <p className="mt-0.5 text-xs text-ink-400">
                              {order.totalPages} pages
                              {order.pricePerPage
                                ? ` × ${inr(order.pricePerPage)}`
                                : " · flat rate"}
                            </p>
                          </>
                        ) : (
                          <p className="font-medium text-ink-900">
                            {t.note || (t.type === "PAYOUT" ? "Payout" : "Earning")}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right text-ink-700">
                        {order ? inr(order.agreedPrice) : "—"}
                      </td>
                      <td className="px-4 py-4 text-right text-ink-500">
                        {order
                          ? `−${inr(order.platformFee)} (${feePctLabel(order.platformFeePct)})`
                          : "—"}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-ink-950">
                        {inr(order ? order.writerEarning : t.amount)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn("pill", meta.tone)}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-ink-500">
                        {formatDate(t.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---------- How payouts work ---------- */}
      <div className="card mt-8 flex flex-col gap-3 border-mint-100 bg-mint-50/50 p-6 sm:flex-row sm:items-start">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-paper text-mint-600 shadow-card">
          <ShieldCheck size={20} />
        </span>
        <div>
          <h3 className="font-display text-lg font-semibold text-ink-950">
            How payouts work
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-600">
            The student&apos;s payment is held securely while you write. Your
            earning becomes <span className="font-medium">eligible</span> the
            moment the student approves the delivered notes — no chasing, no
            uncertainty. Eligible earnings are then paid out to you and marked{" "}
            <span className="font-medium">paid out</span> here. The platform
            fee shown per order is the percentage locked in when that order was
            created.
          </p>
        </div>
      </div>
    </div>
  );
}
