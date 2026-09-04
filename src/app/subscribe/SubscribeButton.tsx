"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inr } from "@/lib/utils";
import type { SubscriptionState } from "@/lib/subscription";
import type { PaymentSessionLike } from "@/components/order/types";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";

/**
 * Pay/Extend button for /subscribe. Mirrors the order payment flow:
 * POST /api/subscribe/pay returns a session — MOCK opens a clearly-labelled
 * dev dialog that simulates a payment, RAZORPAY shows the order id for the
 * (future) real checkout; /api/subscribe/verify then activates the month.
 */
export default function SubscribeButton({
  priceInr,
  status,
}: {
  priceInr: number;
  status: SubscriptionState["status"];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [session, setSession] = useState<PaymentSessionLike | null>(null);
  const [mockOpen, setMockOpen] = useState(false);
  const [rzpPaymentId, setRzpPaymentId] = useState("");
  const [rzpSignature, setRzpSignature] = useState("");

  async function post<T = Record<string, unknown>>(
    path: string,
    body?: unknown
  ): Promise<T | null> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/subscribe/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as T & {
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return null;
      }
      return data;
    } finally {
      setBusy(false);
    }
  }

  async function startPay() {
    const data = await post<PaymentSessionLike>("pay");
    if (!data || !data.mode) return;
    setSession(data);
    if (data.mode === "MOCK") setMockOpen(true);
  }

  async function verifyMock() {
    const paymentId = `pay_MOCK${Math.random().toString(16).slice(2, 10)}`;
    const data = await post("verify", {
      paymentId,
      razorpayOrderId: session?.razorpayOrderId,
      signature: "mock",
    });
    if (data) {
      setMockOpen(false);
      setSession(null);
      router.refresh();
    }
  }

  async function verifyRazorpay() {
    const data = await post("verify", {
      razorpayOrderId: session?.razorpayOrderId,
      paymentId: rzpPaymentId.trim(),
      signature: rzpSignature.trim(),
    });
    if (data) {
      setSession(null);
      router.refresh();
    }
  }

  const label =
    status === "ACTIVE"
      ? `Extend by a month — ${inr(priceInr)}`
      : status === "TRIAL"
        ? `Subscribe early — ${inr(priceInr)}/month`
        : `Subscribe now — ${inr(priceInr)}/month`;

  return (
    <div>
      <button
        onClick={startPay}
        disabled={busy}
        className="btn-accent btn-lg w-full"
      >
        {busy ? (
          <Loader2 size={17} className="animate-spin" />
        ) : (
          <CreditCard size={17} />
        )}
        {label}
      </button>
      <p className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-ink-400">
        <ShieldCheck size={13} className="text-mint-600" />
        Secure payment · each payment adds one month of access
      </p>

      {session && session.mode === "RAZORPAY" && (
        <div className="mt-4 rounded-2xl border border-accent-100 bg-accent-50/50 p-4 text-sm">
          <p className="font-semibold text-ink-900">
            Complete checkout with Razorpay
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Order ID:{" "}
            <code className="rounded bg-paper px-1.5 py-0.5 text-[11px] text-accent-700">
              {session.razorpayOrderId}
            </code>
          </p>
          <p className="mt-2 text-xs leading-relaxed text-ink-500">
            Finish the payment in the Razorpay checkout, then paste the returned
            details below to verify and activate your subscription.
          </p>
          <input
            className="input mt-3"
            placeholder="razorpay_payment_id"
            value={rzpPaymentId}
            onChange={(e) => setRzpPaymentId(e.target.value)}
          />
          <input
            className="input mt-2"
            placeholder="razorpay_signature"
            value={rzpSignature}
            onChange={(e) => setRzpSignature(e.target.value)}
          />
          <button
            onClick={verifyRazorpay}
            disabled={busy || !rzpPaymentId.trim() || !rzpSignature.trim()}
            className="btn-primary btn-md mt-3 w-full"
          >
            {busy && <Loader2 size={15} className="animate-spin" />}
            Verify payment
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {mockOpen && session && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <CreditCard size={18} />
              </span>
              <button
                onClick={() => setMockOpen(false)}
                className="btn-ghost btn-sm px-2"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>
            <h3 className="mt-3 font-display text-lg font-semibold text-ink-950">
              Dev payment mode
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
              Razorpay keys are not configured, so Notely is running in mock
              payment mode. Click below to simulate a successful Razorpay
              payment of{" "}
              <span className="font-semibold text-ink-900">
                {inr(priceInr)}
              </span>{" "}
              — one month of subscription access.
            </p>
            <p className="mt-2 text-xs text-ink-400">
              Mock order ID:{" "}
              <code className="rounded bg-ink-50 px-1.5 py-0.5">
                {session.razorpayOrderId}
              </code>
            </p>
            <button
              onClick={verifyMock}
              disabled={busy}
              className="btn-accent btn-md mt-4 w-full"
            >
              {busy ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <CheckCircle2 size={15} />
              )}
              Simulate successful payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
