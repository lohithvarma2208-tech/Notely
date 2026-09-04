"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Offer, User, WriterProfile } from "@prisma/client";
import Avatar from "@/components/Avatar";
import RatingStars from "@/components/RatingStars";
import EmptyState from "@/components/EmptyState";
import { cn, inr, timeAgo } from "@/lib/utils";
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  FileText,
  Inbox,
  ShieldCheck,
} from "lucide-react";

export type OfferWithWriter = Offer & {
  writer: Pick<User, "id" | "name" | "avatarUrl"> & {
    writerProfile: Pick<
      WriterProfile,
      "ratingAvg" | "ratingCount" | "jobsCompleted" | "totalPagesWritten" | "onTimePercent"
    > | null;
  };
};

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pending", cls: "bg-amber-50 text-amber-700" },
  ACCEPTED: { label: "Accepted", cls: "bg-mint-50 text-mint-700" },
  DECLINED: { label: "Declined", cls: "bg-ink-100 text-ink-500" },
  WITHDRAWN: { label: "Withdrawn", cls: "bg-ink-100 text-ink-500" },
};

export default function OffersList({
  offers,
  estPages,
  canAccept,
}: {
  offers: OfferWithWriter[];
  estPages: number | null;
  canAccept: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function accept(offer: OfferWithWriter) {
    if (
      !window.confirm(
        `Accept ${offer.writer.name}'s offer for ${inr(offer.totalPrice)}? This creates an order — the remaining offers will be declined.`
      )
    )
      return;
    setBusyId(offer.id);
    setError(null);
    try {
      const res = await fetch(`/api/offers/${offer.id}/accept`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        orderId?: string;
        order?: { id?: string };
      };
      if (!res.ok) {
        setError(data.error ?? "Could not accept this offer. Please try again.");
        return;
      }
      router.refresh();
      const orderId = data.orderId ?? data.order?.id;
      if (orderId) router.push(`/orders/${orderId}`);
    } finally {
      setBusyId(null);
    }
  }

  if (offers.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No offers yet"
        body="Note writers usually respond within a few hours. You'll get a notification as soon as the first offer arrives."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</p>
      )}
      {offers.map((o) => {
        const profile = o.writer.writerProfile;
        const pill = STATUS_PILL[o.status] ?? STATUS_PILL.PENDING;
        const inactive = o.status !== "PENDING";
        return (
          <article
            key={o.id}
            className={cn(
              "card p-5 sm:p-6",
              inactive && "opacity-60",
              o.status === "ACCEPTED" && "border-mint-400 opacity-100 ring-1 ring-mint-400"
            )}
          >
            <div className="flex flex-wrap items-start gap-4">
              {/* Writer mini-card */}
              <div className="flex min-w-0 flex-1 items-start gap-3.5">
                <Avatar name={o.writer.name} url={o.writer.avatarUrl} size={46} />
                <div className="min-w-0">
                  <Link
                    href={`/writers/${o.writer.id}`}
                    className="font-display text-lg font-semibold text-ink-950 hover:text-accent-700"
                  >
                    {o.writer.name}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm">
                    <RatingStars value={profile?.ratingAvg ?? 0} />
                    <span className="font-semibold text-ink-800">
                      {(profile?.ratingAvg ?? 0).toFixed(1)}
                    </span>
                    <span className="text-ink-400">({profile?.ratingCount ?? 0})</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-mint-600" />
                      {profile?.jobsCompleted ?? 0} jobs done
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FileText size={12} className="text-accent-600" />
                      {(profile?.totalPagesWritten ?? 0).toLocaleString("en-IN")} pages
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} className="text-amber-500" />
                      {profile?.onTimePercent ?? 100}% on-time
                    </span>
                  </div>
                </div>
              </div>

              {/* Price block */}
              <div className="text-right">
                <p className="text-xl font-bold text-ink-950">{inr(o.totalPrice)}</p>
                {o.priceType === "PER_PAGE" && o.pricePerPage ? (
                  <p className="text-xs text-ink-400">
                    {inr(o.pricePerPage)}/page
                    {estPages ? ` × ${estPages} pages` : ""} (est.)
                  </p>
                ) : (
                  <p className="text-xs text-ink-400">total price</p>
                )}
                <p className="mt-1 text-xs font-medium text-ink-600">
                  Delivery in {o.estimatedDays} day{o.estimatedDays === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {o.message && (
              <div className="ruled-paper ruled-margin mt-4 rounded-xl border border-ink-100 p-3.5 pl-11">
                <p className="font-hand2 text-lg leading-[28px] text-ink-800">{o.message}</p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4">
              <div className="flex items-center gap-2">
                <span className={cn("pill", pill.cls)}>{pill.label}</span>
                <span className="text-xs text-ink-400">{timeAgo(o.createdAt)}</span>
              </div>
              {canAccept && o.status === "PENDING" ? (
                <button
                  type="button"
                  onClick={() => accept(o)}
                  disabled={busyId !== null}
                  className="btn-accent btn-sm"
                >
                  <BadgeCheck size={14} />
                  {busyId === o.id ? "Accepting…" : "Accept offer"}
                </button>
              ) : (
                o.status === "ACCEPTED" && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-mint-700">
                    <ShieldCheck size={13} /> Order created from this offer
                  </span>
                )
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
