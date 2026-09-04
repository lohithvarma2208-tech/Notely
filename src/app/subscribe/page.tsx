import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getSubscriptionState } from "@/lib/subscription";
import { formatDate, inr } from "@/lib/utils";
import SubscribeButton from "./SubscribeButton";
import {
  AlertTriangle,
  BadgeCheck,
  Camera,
  NotebookPen,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Subscription",
  description:
    "Your Notely subscription — every account starts with a free trial, then continues on one simple monthly plan.",
};

export default async function SubscribePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/subscribe");

  const state = await getSubscriptionState(user);

  const features = [
    {
      icon: NotebookPen,
      title: "Unlimited note requests",
      body: "Post as many requests as you need — handwritten, digital, or notes cleaned up.",
    },
    {
      icon: BadgeCheck,
      title: "Hire verified writers",
      body: "Receive offers from rated note writers and pick the one that fits.",
    },
    {
      icon: ShieldCheck,
      title: "Escrow-protected payments",
      body: "Money is held safely and released to the writer only after you approve the notes.",
    },
    {
      icon: Camera,
      title: "Progress tracking",
      body: "Follow page-by-page progress with photo updates until the delivery lands.",
    },
  ];

  return (
    <div className="container-x py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        {/* ---------- Header ---------- */}
        <span className="eyebrow">Subscription</span>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl">
          Your <span className="italic text-accent-700">subscription</span>
        </h1>
        <p className="mt-2 text-ink-500">
          Every account starts with a free trial. After that, one flat monthly
          plan keeps full access to the marketplace.
        </p>

        {/* ---------- Current state ---------- */}
        {state.status === "TRIAL" && (
          <div className="card mt-8 flex items-start gap-4 border-accent-100 bg-gradient-to-r from-accent-50 to-mint-50/40 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-accent-600 shadow-card">
              <Sparkles size={18} />
            </span>
            <div>
              <p className="font-semibold text-ink-900">
                You&apos;re on the free trial
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-500">
                {state.trialDaysLeft} day{state.trialDaysLeft === 1 ? "" : "s"}{" "}
                left
                {user.trialEndsAt && (
                  <> — full access until {formatDate(user.trialEndsAt)}</>
                )}
                . Subscribe anytime; paid time starts after your trial ends.
              </p>
            </div>
          </div>
        )}
        {state.status === "ACTIVE" && (
          <div className="card mt-8 flex items-start gap-4 border-mint-100 bg-mint-50/60 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-mint-600 shadow-card">
              <BadgeCheck size={18} />
            </span>
            <div>
              <p className="font-semibold text-ink-900">Subscription active</p>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-500">
                Paid until {formatDate(state.paidUntil)}. Every payment adds one
                more month on top of the time you have left.
              </p>
            </div>
          </div>
        )}
        {state.status === "EXPIRED" && (
          <div className="card mt-8 flex items-start gap-4 border-amber-200 bg-amber-50/60 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-amber-600 shadow-card">
              <AlertTriangle size={18} />
            </span>
            <div>
              <p className="font-semibold text-ink-900">
                Your free trial has ended
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-500">
                Subscribe below to keep posting note requests and making offers.
              </p>
            </div>
          </div>
        )}

        {/* ---------- Plan card ---------- */}
        <div className="card mt-6 overflow-hidden">
          <div className="border-b border-ink-100 bg-ink-950 px-6 py-6 text-paper sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-300">
              Notely membership
            </p>
            <p className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
              {inr(state.priceInr)}
              <span className="text-lg font-normal text-ink-300">/month</span>
            </p>
            <p className="mt-1.5 text-sm text-ink-300">
              after your {state.trialDays}-day free trial
            </p>
          </div>
          <div className="p-6 sm:p-8">
            <ul className="grid gap-4 sm:grid-cols-2">
              {features.map((f) => (
                <li key={f.title} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                    <f.icon size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      {f.title}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-snug text-ink-500">
                      {f.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <SubscribeButton priceInr={state.priceInr} status={state.status} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
