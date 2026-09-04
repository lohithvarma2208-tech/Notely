"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { inr } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Send, Wallet } from "lucide-react";

const MESSAGE_TEMPLATE = `Hi! I read your requirements carefully — I can prepare these notes exactly in the style you've described. I write neat, exam-ready notes and will share progress photos as I go. Happy to clarify anything before we start.`;

export default function OfferForm({
  requestId,
  estPages,
  pagesUnknown,
  budgetMin,
  budgetMax,
  minOffer,
  maxOffer,
}: {
  requestId: string;
  estPages: number | null;
  pagesUnknown: boolean;
  budgetMin: number;
  budgetMax: number;
  minOffer: number;
  maxOffer: number;
}) {
  const router = useRouter();
  // Per-page pricing needs a page estimate to turn into a total — when the
  // student marked pages as TBD we only take total-price offers.
  const canPricePerPage = !pagesUnknown && estPages !== null && estPages > 0;

  const [priceType, setPriceType] = useState<"TOTAL" | "PER_PAGE">("TOTAL");
  const [totalPrice, setTotalPrice] = useState("");
  const [pricePerPage, setPricePerPage] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("3");
  const [message, setMessage] = useState(MESSAGE_TEMPLATE);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const perPage = Number(pricePerPage);
  const estTotal = useMemo(() => {
    if (priceType === "PER_PAGE") {
      return canPricePerPage && perPage > 0 ? perPage * estPages : 0;
    }
    return Number(totalPrice) || 0;
  }, [priceType, perPage, totalPrice, canPricePerPage, estPages]);

  function validate(): string | null {
    if (priceType === "PER_PAGE") {
      if (!pricePerPage || perPage < 1) return "Enter your price per page.";
      if (estTotal > 0 && (estTotal < minOffer || estTotal > maxOffer))
        return `Your estimated total (${inr(estTotal)}) must be between ${inr(minOffer)} and ${inr(maxOffer)}.`;
    } else {
      const t = Number(totalPrice);
      if (!totalPrice || !Number.isInteger(t) || t < 1) return "Enter your total price in rupees.";
      if (t < minOffer || t > maxOffer)
        return `Offers must be between ${inr(minOffer)} and ${inr(maxOffer)}.`;
    }
    const d = Number(estimatedDays);
    if (!estimatedDays || !Number.isInteger(d) || d < 1 || d > 90)
      return "Delivery estimate must be a whole number of days (1–90).";
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/requests/${requestId}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceType,
          ...(priceType === "TOTAL"
            ? { totalPrice: Number(totalPrice) }
            : { pricePerPage: perPage }),
          estimatedDays: Number(estimatedDays),
          message: message.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not send your offer. Please try again.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {canPricePerPage && (
        <div>
          <span className="label">How do you want to price it?</span>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-ink-50 p-1">
            {(
              [
                { value: "TOTAL", label: "Total price" },
                { value: "PER_PAGE", label: "Price per page" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setPriceType(opt.value);
                  setError(null);
                }}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  priceType === opt.value
                    ? "bg-paper text-ink-950 shadow-card"
                    : "text-ink-500 hover:text-ink-800"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {priceType === "PER_PAGE" && canPricePerPage ? (
        <div>
          <label htmlFor="pricePerPage" className="label">
            Your price per page (₹)
          </label>
          <input
            id="pricePerPage"
            type="number"
            min={1}
            step={1}
            className="input"
            placeholder="e.g. 9"
            value={pricePerPage}
            onChange={(e) => setPricePerPage(e.target.value)}
          />
          {estTotal > 0 && (
            <p className="mt-2 rounded-xl bg-mint-50 px-3 py-2 text-sm font-medium text-mint-700">
              <Wallet size={13} className="mr-1 inline" />
              Estimated total: {inr(perPage)}/page × {estPages} pages ≈{" "}
              <span className="font-bold">{inr(estTotal)}</span>
            </p>
          )}
        </div>
      ) : (
        <div>
          <label htmlFor="totalPrice" className="label">
            Your total price (₹)
          </label>
          <input
            id="totalPrice"
            type="number"
            min={minOffer}
            max={maxOffer}
            step={1}
            className="input"
            placeholder={`e.g. ${Math.max(minOffer, Math.round((budgetMin + budgetMax) / 2))}`}
            value={totalPrice}
            onChange={(e) => setTotalPrice(e.target.value)}
          />
          {pagesUnknown && (
            <p className="mt-1.5 text-xs text-ink-400">
              The page count isn&apos;t specified for this request, so please
              quote a single total price.
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-ink-400">
        Student&apos;s budget:{" "}
        <span className="font-semibold text-ink-600">
          {inr(budgetMin)}–{inr(budgetMax)}
        </span>{" "}
        · offers allowed between {inr(minOffer)} and {inr(maxOffer)}
      </p>

      <div>
        <label htmlFor="estimatedDays" className="label">
          Delivery time (days)
        </label>
        <input
          id="estimatedDays"
          type="number"
          min={1}
          max={90}
          step={1}
          className="input"
          value={estimatedDays}
          onChange={(e) => setEstimatedDays(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="message" className="label">
          Message to the student
        </label>
        <textarea
          id="message"
          rows={5}
          maxLength={2000}
          className="input resize-y"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</p>
      )}

      <button type="submit" disabled={busy} className="btn-accent btn-md w-full">
        <Send size={15} />
        {busy ? "Sending offer…" : "Send offer"}
      </button>
      <p className="text-center text-[11px] leading-relaxed text-ink-400">
        If the student accepts, payment is held safely by Notely and released to
        you after the notes are approved.
      </p>
    </form>
  );
}
