"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn, inr, timeAgo } from "@/lib/utils";
import { Clock, Undo2 } from "lucide-react";

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pending", cls: "bg-amber-50 text-amber-700" },
  ACCEPTED: { label: "Accepted", cls: "bg-mint-50 text-mint-700" },
  DECLINED: { label: "Declined", cls: "bg-ink-100 text-ink-500" },
  WITHDRAWN: { label: "Withdrawn", cls: "bg-ink-100 text-ink-500" },
};

/** The viewing writer's own offer on this request, with a Withdraw action. */
export default function MyOfferCard({
  offerId,
  status,
  priceType,
  totalPrice,
  pricePerPage,
  estPages,
  estimatedDays,
  message,
  createdAt,
}: {
  offerId: string;
  status: string;
  priceType: string;
  totalPrice: number;
  pricePerPage: number | null;
  estPages: number | null;
  estimatedDays: number;
  message: string;
  createdAt: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pill = STATUS_PILL[status] ?? STATUS_PILL.PENDING;

  async function withdraw() {
    if (!window.confirm("Withdraw your offer? The student will no longer see it."))
      return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "WITHDRAWN" }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not withdraw the offer. Please try again.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className={cn("pill", pill.cls)}>{pill.label}</span>
        <span className="text-xs text-ink-400">{timeAgo(createdAt)}</span>
      </div>

      <div>
        <p className="text-2xl font-bold text-ink-950">{inr(totalPrice)}</p>
        <p className="mt-0.5 text-xs text-ink-400">
          {priceType === "PER_PAGE" && pricePerPage
            ? `${inr(pricePerPage)}/page${estPages ? ` × ${estPages} pages` : ""} (est.)`
            : "total price"}
        </p>
        <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-ink-600">
          <Clock size={14} className="text-amber-500" />
          Delivery in {estimatedDays} day{estimatedDays === 1 ? "" : "s"}
        </p>
      </div>

      {message && (
        <div className="ruled-paper ruled-margin rounded-xl border border-ink-100 p-3 pl-11">
          <p className="font-hand2 text-base leading-[28px] text-ink-800">{message}</p>
        </div>
      )}

      {status === "PENDING" ? (
        <>
          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
          <button
            type="button"
            onClick={withdraw}
            disabled={busy}
            className="btn-outline btn-sm w-full"
          >
            <Undo2 size={13} />
            {busy ? "Withdrawing…" : "Withdraw offer"}
          </button>
          <p className="text-center text-[11px] text-ink-400">
            The student has been notified and can accept your offer anytime.
          </p>
        </>
      ) : (
        <p className="text-xs text-ink-400">
          {status === "WITHDRAWN"
            ? "You withdrew this offer. You can send a new one below."
            : status === "DECLINED"
              ? "The student went with another writer for this one."
              : "This offer was accepted — check your dashboard for the order."}
        </p>
      )}
    </div>
  );
}
