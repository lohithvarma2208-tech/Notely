import Link from "next/link";
import type { User } from "@prisma/client";
import { getSubscriptionState } from "@/lib/subscription";
import { inr } from "@/lib/utils";
import { AlertTriangle, ArrowRight, Sparkles } from "lucide-react";

/**
 * Subscription notice for the dashboards. TRIAL shows a slim reminder with a
 * subscribe link, EXPIRED shows a prominent call to subscribe, and ACTIVE
 * renders nothing — no noise when everything is fine.
 */
export default async function SubscriptionBanner({
  user,
}: {
  user: Pick<User, "trialEndsAt" | "subscriptionPaidUntil">;
}) {
  const state = await getSubscriptionState(user);

  if (state.status === "ACTIVE") return null;

  if (state.status === "TRIAL") {
    return (
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-accent-100 bg-accent-50/60 px-4 py-2.5">
        <p className="flex items-center gap-2 text-sm text-accent-800">
          <Sparkles size={15} className="shrink-0 text-accent-600" />
          <span>
            <span className="font-semibold">Free trial:</span>{" "}
            {state.trialDaysLeft} day{state.trialDaysLeft === 1 ? "" : "s"} left
          </span>
        </p>
        <Link
          href="/subscribe"
          className="flex items-center gap-1 text-sm font-medium text-accent-700 hover:text-accent-800"
        >
          Subscribe <ArrowRight size={13} />
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
      <p className="flex items-start gap-2.5 text-sm leading-relaxed text-amber-800">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
        <span>
          <span className="font-semibold">Your free trial has ended</span> —
          subscribe for {inr(state.priceInr)}/month to continue posting requests
          and offers.
        </span>
      </p>
      <Link href="/subscribe" className="btn-primary btn-sm shrink-0">
        Subscribe
      </Link>
    </div>
  );
}
