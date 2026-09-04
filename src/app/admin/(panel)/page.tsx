import type { Metadata } from "next";
import {
  BadgeCheck,
  Clock,
  FileText,
  IndianRupee,
  PenLine,
  Users,
  Wallet,
} from "lucide-react";
import { db } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { inr } from "@/lib/utils";
import StatusPill from "@/components/StatusPill";
import ConfigEditor from "@/components/admin/ConfigEditor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin overview",
  description: "Marketplace stats and platform configuration.",
};

const CONFIG_KEYS = [
  "platformFeePercent",
  "subscriptionPriceInr",
  "subscriptionTrialDays",
  "minOfferRupees",
  "maxOfferRupees",
] as const;

export default async function AdminOverviewPage() {
  const now = new Date();
  const [
    userCount,
    writerCount,
    openRequests,
    ordersByStatus,
    gmvAgg,
    feesAgg,
    activeSubs,
    trialsInProgress,
    configEntries,
  ] = await Promise.all([
    db.user.count(),
    db.writerProfile.count(),
    db.noteRequest.count({ where: { status: "OPEN" } }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
    db.order.aggregate({
      _sum: { agreedPrice: true },
      where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
    }),
    db.order.aggregate({
      _sum: { platformFee: true },
      where: { status: "COMPLETED" },
    }),
    db.user.count({ where: { subscriptionPaidUntil: { gt: now } } }),
    // Matches getSubscriptionState: TRIAL means the trial is still running
    // and no paid subscription has taken over yet.
    db.user.count({
      where: {
        trialEndsAt: { gt: now },
        OR: [
          { subscriptionPaidUntil: null },
          { subscriptionPaidUntil: { lte: now } },
        ],
      },
    }),
    Promise.all(
      CONFIG_KEYS.map(async (key) => [key, await getConfig(key)] as const)
    ),
  ]);

  const config = Object.fromEntries(configEntries) as Record<
    (typeof CONFIG_KEYS)[number],
    string
  >;

  const stats = [
    {
      icon: Users,
      label: "Total users",
      value: userCount.toLocaleString("en-IN"),
      hint: "Students and writers",
    },
    {
      icon: PenLine,
      label: "Note writers",
      value: writerCount.toLocaleString("en-IN"),
      hint: "With a writer profile",
    },
    {
      icon: FileText,
      label: "Open requests",
      value: openRequests.toLocaleString("en-IN"),
      hint: "Waiting for offers",
    },
    {
      icon: IndianRupee,
      label: "Gross order value",
      value: inr(gmvAgg._sum.agreedPrice ?? 0),
      hint: "Excludes cancelled & refunded",
    },
    {
      icon: Wallet,
      label: "Platform fees earned",
      value: inr(feesAgg._sum.platformFee ?? 0),
      hint: "From completed orders",
    },
    {
      icon: BadgeCheck,
      label: "Active subscriptions",
      value: activeSubs.toLocaleString("en-IN"),
      hint: "Paid members",
    },
    {
      icon: Clock,
      label: "Trials in progress",
      value: trialsInProgress.toLocaleString("en-IN"),
      hint: "Free trial, not yet paid",
    },
  ];

  const totalOrders = ordersByStatus.reduce(
    (sum, s) => sum + s._count._all,
    0
  );
  const statusRows = [...ordersByStatus].sort(
    (a, b) => b._count._all - a._count._all
  );

  return (
    <div className="space-y-10">
      {/* ---------- Stat cards ---------- */}
      <section>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
          Marketplace <span className="italic text-accent-700">overview</span>
        </h1>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="card p-5">
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
      </section>

      {/* ---------- Orders by status ---------- */}
      <section className="card p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink-950">
            Orders by status
          </h2>
          <p className="text-sm text-ink-400">
            {totalOrders.toLocaleString("en-IN")} total
          </p>
        </div>
        {statusRows.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">
            No orders yet — they&apos;ll appear here as students hire note
            writers.
          </p>
        ) : (
          <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {statusRows.map((s) => (
              <li
                key={s.status}
                className="flex items-center justify-between gap-3 border-b border-ink-100 pb-2.5"
              >
                <StatusPill status={s.status} />
                <span className="font-semibold text-ink-900">
                  {s._count._all.toLocaleString("en-IN")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- Platform configuration ---------- */}
      <section className="card p-6">
        <h2 className="font-display text-xl font-semibold tracking-tight text-ink-950">
          Platform configuration
        </h2>
        <p className="mt-1 mb-5 text-sm text-ink-500">
          These values are read from the database at runtime — nothing is
          hardcoded. Changes apply immediately to new orders, offers, trials
          and subscriptions.
        </p>
        <ConfigEditor initial={config} />
      </section>
    </div>
  );
}
