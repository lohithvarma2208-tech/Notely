"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inr } from "@/lib/utils";
import DeliveryPanel, { DeliveryFiles } from "./DeliveryPanel";
import type { DeliveryFile, PaymentSessionLike } from "./types";
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  Loader2,
  PackageCheck,
  PenLine,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";

type Role = "STUDENT" | "WRITER";

export default function OrderActions({
  orderId,
  status,
  role,
  agreedPrice,
  totalPages,
  pricePerPage,
  pagesCompleted,
  deliveryMethod,
  deliveryFiles,
  writerEarning,
  platformFeePct,
}: {
  orderId: string;
  status: string;
  role: Role;
  agreedPrice: number;
  totalPages: number;
  pricePerPage: number | null;
  pagesCompleted: number;
  deliveryMethod: string;
  deliveryFiles: DeliveryFile[];
  writerEarning: number;
  platformFeePct: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // payment flow state
  const [session, setSession] = useState<PaymentSessionLike | null>(null);
  const [mockOpen, setMockOpen] = useState(false);
  const [rzpPaymentId, setRzpPaymentId] = useState("");
  const [rzpSignature, setRzpSignature] = useState("");

  // delivery / revision flow state
  const [delivering, setDelivering] = useState(false);
  const [revising, setRevising] = useState(false);
  const [revisionMsg, setRevisionMsg] = useState("");

  async function post<T = Record<string, unknown>>(
    path: string,
    body?: unknown
  ): Promise<T | null> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as T & { error?: string };
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

  async function simpleAction(path: string, body?: unknown) {
    const data = await post(path, body);
    if (data) router.refresh();
  }

  const feePctLabel = String(platformFeePct).replace(/\.0+$/, "");

  let content: React.ReactNode;

  if (status === "AWAITING_PAYMENT") {
    content =
      role === "STUDENT" ? (
        <>
          <p className="text-sm leading-relaxed text-ink-500">
            Fund the order to lock in your writer. Notely holds the money safely and
            releases it only after you approve the delivered notes.
          </p>
          <div className="mt-4 rounded-xl bg-ink-50/70 px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ink-500">Total to pay</span>
              <span className="text-lg font-bold text-ink-950">{inr(agreedPrice)}</span>
            </div>
            {pricePerPage && (
              <div className="mt-1 flex items-center justify-between text-xs text-ink-400">
                <span>
                  {totalPages} pages × {inr(pricePerPage)}/page
                </span>
                <span>Notely fee {feePctLabel}% included</span>
              </div>
            )}
          </div>
          <button onClick={startPay} disabled={busy} className="btn-accent btn-lg mt-4 w-full">
            {busy ? <Loader2 size={17} className="animate-spin" /> : <CreditCard size={17} />}
            Pay {inr(agreedPrice)} securely
          </button>
          <p className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-ink-400">
            <ShieldCheck size={13} className="text-mint-600" />
            Payment protected — released only on your approval
          </p>

          {session && session.mode === "RAZORPAY" && (
            <div className="mt-4 rounded-2xl border border-accent-100 bg-accent-50/50 p-4 text-sm">
              <p className="font-semibold text-ink-900">Complete checkout with Razorpay</p>
              <p className="mt-1 text-xs text-ink-500">
                Order ID:{" "}
                <code className="rounded bg-paper px-1.5 py-0.5 text-[11px] text-accent-700">
                  {session.razorpayOrderId}
                </code>
              </p>
              <p className="mt-2 text-xs leading-relaxed text-ink-500">
                Finish the payment in the Razorpay checkout, then paste the returned
                details below to verify and fund this order.
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
        </>
      ) : (
        <InfoNote icon={IndianRupee}>
          Waiting for the student to fund this order. The money is held by Notely and
          becomes your earning once the delivery is approved.
        </InfoNote>
      );
  } else if (status === "FUNDED") {
    content =
      role === "WRITER" ? (
        <>
          <p className="text-sm leading-relaxed text-ink-500">
            {inr(agreedPrice)} is funded and held safely. Start writing when ready — post
            progress updates with photos as pages pile up.
          </p>
          <button
            onClick={() => simpleAction("start")}
            disabled={busy}
            className="btn-primary btn-lg mt-4 w-full"
          >
            {busy ? <Loader2 size={17} className="animate-spin" /> : <PenLine size={17} />}
            Start writing
          </button>
        </>
      ) : (
        <InfoNote icon={ShieldCheck}>
          Your payment of {inr(agreedPrice)} is held safely. The writer will start on
          your notes shortly.
        </InfoNote>
      );
  } else if (status === "IN_PROGRESS") {
    content =
      role === "WRITER" ? (
        <>
          {!delivering ? (
            <>
              <p className="text-sm leading-relaxed text-ink-500">
                Finished all {totalPages} pages? Submit the delivery for the student to
                review.
              </p>
              <button
                onClick={() => setDelivering(true)}
                disabled={busy}
                className="btn-primary btn-lg mt-4 w-full"
              >
                <PackageCheck size={17} /> Submit completed notes
              </button>
            </>
          ) : (
            <DeliveryPanel
              orderId={orderId}
              deliveryMethod={deliveryMethod}
              onDone={() => setDelivering(false)}
            />
          )}
        </>
      ) : (
        <InfoNote icon={PenLine}>
          The writer is working on your notes — {pagesCompleted} of {totalPages} pages
          done so far. Progress updates appear on this page.
        </InfoNote>
      );
  } else if (status === "READY_FOR_REVIEW") {
    content =
      role === "STUDENT" ? (
        <>
          <p className="text-sm leading-relaxed text-ink-500">
            The notes are ready. Go through the delivery — approve to release the
            payment, or ask for changes.
          </p>
          {deliveryFiles.length > 0 && (
            <div className="mt-4">
              <p className="label">Delivered files</p>
              <DeliveryFiles files={deliveryFiles} />
            </div>
          )}
          {!revising ? (
            <div className="mt-4 space-y-2">
              <button
                onClick={() => simpleAction("approve")}
                disabled={busy}
                className="btn-accent btn-lg w-full"
              >
                {busy ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={17} />
                )}
                Approve &amp; release {inr(agreedPrice)}
              </button>
              <button
                onClick={() => setRevising(true)}
                disabled={busy}
                className="btn-outline btn-md w-full"
              >
                <RotateCcw size={15} /> Request revision
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <label className="label" htmlFor="revision-msg">
                What should change?
              </label>
              <textarea
                id="revision-msg"
                className="input min-h-[90px] resize-y"
                placeholder="e.g. Pages 12–14 are missing the diagrams — please redraw them like page 9."
                value={revisionMsg}
                onChange={(e) => setRevisionMsg(e.target.value)}
                maxLength={1000}
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() =>
                    simpleAction("request-revision", { message: revisionMsg.trim() })
                  }
                  disabled={busy || revisionMsg.trim().length < 3}
                  className="btn-primary btn-md flex-1"
                >
                  {busy && <Loader2 size={15} className="animate-spin" />}
                  Send revision request
                </button>
                <button
                  onClick={() => setRevising(false)}
                  disabled={busy}
                  className="btn-ghost btn-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <InfoNote icon={PackageCheck}>
          Delivery submitted. The student is reviewing your work — payment is released
          on approval.
        </InfoNote>
      );
  } else if (status === "REVISION_REQUESTED") {
    content =
      role === "WRITER" ? (
        <>
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="text-sm leading-relaxed text-amber-800">
              The student requested changes on this delivery. Check the chat for details,
              rework the pages and submit again.
            </p>
          </div>
          <button
            onClick={() =>
              simpleAction("progress", {
                pagesCompleted,
                note: "Picking up the requested revision — back to work on it.",
              })
            }
            disabled={busy}
            className="btn-primary btn-lg mt-4 w-full"
          >
            {busy ? <Loader2 size={17} className="animate-spin" /> : <PenLine size={17} />}
            Back to work on the revision
          </button>
        </>
      ) : (
        <InfoNote icon={RotateCcw}>
          You requested a revision. The writer has been notified and will re-submit the
          delivery.
        </InfoNote>
      );
  } else if (status === "APPROVED") {
    content = (
      <InfoNote icon={BadgeCheck}>
        Delivery approved — the order is being wrapped up and the writer&apos;s payout
        is being released.
      </InfoNote>
    );
  } else if (status === "COMPLETED") {
    content = (
      <div className="rounded-xl border border-mint-100 bg-mint-50 px-4 py-4">
        <p className="flex items-center gap-2 font-semibold text-mint-700">
          <CheckCircle2 size={17} /> Order completed
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-mint-700/80">
          {role === "WRITER" ? (
            <>
              You earned {inr(writerEarning)} on this order ({inr(agreedPrice)} minus the{" "}
              {feePctLabel}% Notely fee). Nice work.
            </>
          ) : (
            <>
              Payment of {inr(agreedPrice)} released to the writer. Enjoy your notes —
              and don&apos;t forget to leave a review below.
            </>
          )}
        </p>
        {deliveryFiles.length > 0 && (
          <div className="mt-4">
            <p className="label">Your files</p>
            <DeliveryFiles files={deliveryFiles} />
          </div>
        )}
      </div>
    );
  } else if (status === "CANCELLED" || status === "REFUNDED") {
    content = (
      <div className="rounded-xl bg-ink-50/80 px-4 py-4">
        <p className="flex items-center gap-2 font-semibold text-ink-600">
          <Ban size={16} />
          {status === "CANCELLED" ? "This order was cancelled" : "This order was refunded"}
        </p>
        <p className="mt-1 text-sm text-ink-400">
          {status === "CANCELLED"
            ? "No work or payment is due on this order anymore."
            : "The funded amount was returned to the student."}
        </p>
      </div>
    );
  } else if (status === "DISPUTED") {
    content = (
      <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-4">
        <p className="flex items-center gap-2 font-semibold text-red-600">
          <AlertTriangle size={16} /> Order under dispute
        </p>
        <p className="mt-1 text-sm text-red-500">
          Notely support is reviewing this order. Keep the chat history intact — it is
          part of the record.
        </p>
      </div>
    );
  } else {
    content = (
      <InfoNote icon={ShieldCheck}>
        This order is being set up. Actions will appear here as it moves forward.
      </InfoNote>
    );
  }

  return (
    <section className="card p-6">
      <h2 className="label">Next step</h2>
      {content}
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
              Razorpay keys are not configured, so Notely is running in mock payment
              mode. Click below to simulate a successful Razorpay payment of{" "}
              <span className="font-semibold text-ink-900">{inr(agreedPrice)}</span>.
            </p>
            <p className="mt-2 text-xs text-ink-400">
              Mock order ID:{" "}
              <code className="rounded bg-ink-50 px-1.5 py-0.5">{session.razorpayOrderId}</code>
            </p>
            <button onClick={verifyMock} disabled={busy} className="btn-accent btn-md mt-4 w-full">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              Simulate successful payment
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function InfoNote({
  icon: Icon,
  children,
}: {
  icon: typeof ShieldCheck;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-ink-50/70 px-4 py-3.5">
      <Icon size={17} className="mt-0.5 shrink-0 text-ink-400" />
      <p className="text-sm leading-relaxed text-ink-500">{children}</p>
    </div>
  );
}
