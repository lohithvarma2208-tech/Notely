"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Loader2, Star } from "lucide-react";

const CATEGORIES = [
  { key: "overall", label: "Overall experience" },
  { key: "handwriting", label: "Handwriting quality" },
  { key: "accuracy", label: "Accuracy of content" },
  { key: "neatness", label: "Neatness & organization" },
  { key: "communication", label: "Communication" },
  { key: "onTime", label: "On-time delivery" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

type Ratings = Record<CategoryKey, number>;

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <span className="inline-flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          className="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
          aria-label={`${i} star${i === 1 ? "" : "s"}`}
        >
          <Star
            size={18}
            className={cn(
              i <= shown ? "fill-amber-400 text-amber-400" : "fill-ink-100 text-ink-100"
            )}
          />
        </button>
      ))}
    </span>
  );
}

export default function ReviewForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [ratings, setRatings] = useState<Ratings>({
    overall: 0,
    handwriting: 0,
    accuracy: 0,
    neatness: 0,
    communication: 0,
    onTime: 0,
  });
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allRated = CATEGORIES.every((c) => ratings[c.key] > 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ratings, text: text.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not submit the review.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-6">
      <h2 className="font-display text-lg font-semibold text-ink-950">
        Rate your note writer
      </h2>
      <p className="mt-1 text-sm text-ink-500">
        Your review builds the writer&apos;s public rating — it only counts when it&apos;s
        honest.
      </p>
      <form onSubmit={submit} className="mt-4">
        <div className="space-y-2.5">
          {CATEGORIES.map((c) => (
            <div key={c.key} className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink-600">{c.label}</span>
              <StarPicker
                value={ratings[c.key]}
                onChange={(v) => setRatings((prev) => ({ ...prev, [c.key]: v }))}
              />
            </div>
          ))}
        </div>
        <label className="label mt-4" htmlFor="review-text">
          Written review <span className="normal-case text-ink-300">(optional)</span>
        </label>
        <textarea
          id="review-text"
          className="input min-h-[90px] resize-y"
          placeholder="How were the notes? Legible, complete, on time?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy || !allRated} className="btn-accent btn-md mt-4 w-full">
          {busy && <Loader2 size={15} className="animate-spin" />}
          Submit review
        </button>
        {!allRated && (
          <p className="mt-2 text-center text-xs text-ink-400">
            Rate every category to submit.
          </p>
        )}
      </form>
    </section>
  );
}
