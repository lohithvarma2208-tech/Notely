"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  SUBJECTS,
  LANGUAGES,
  HANDWRITING_STYLES,
  AVAILABILITY,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

export type WriterFilterValues = {
  q: string;
  subject: string;
  language: string;
  style: string;
  availability: string;
  maxPrice: string;
  minRating: string;
  mode: string;
  verified: string;
  sort: string;
};

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "top_rated", label: "Top rated" },
  { value: "experienced", label: "Most experienced" },
  { value: "price_low", label: "Lowest price" },
  { value: "fastest", label: "Fastest delivery" },
  { value: "newest", label: "Newest" },
] as const;

const MODE_OPTIONS = [
  { value: "", label: "Both" },
  { value: "digital", label: "Digital" },
  { value: "handwritten", label: "Handwritten" },
] as const;

/**
 * Search bar + filter panel for /writers. Purely a URL builder — every change
 * pushes a query string and the server page re-queries Prisma.
 */
export default function WriterFilters({
  current,
  count,
  children,
}: {
  current: WriterFilterValues;
  count: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(current.q);
  const [price, setPrice] = useState(current.maxPrice);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => setQ(current.q), [current.q]);
  useEffect(() => setPrice(current.maxPrice), [current.maxPrice]);

  function push(patch: Partial<WriterFilterValues>) {
    const next = { ...current, ...patch };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) {
      if (v && !(k === "sort" && v === "recommended")) params.set(k, v);
    }
    const qs = params.toString();
    startTransition(() =>
      router.replace(qs ? `/writers?${qs}` : "/writers", { scroll: false })
    );
  }

  // Debounce the free-text inputs so each keystroke doesn't navigate.
  useEffect(() => {
    if (q === current.q) return;
    const t = setTimeout(() => push({ q }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    if (price === current.maxPrice) return;
    const t = setTimeout(() => push({ maxPrice: price }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price]);

  const activeFilters = [
    current.subject,
    current.language,
    current.style,
    current.availability,
    current.maxPrice,
    current.minRating,
    current.mode,
    current.verified,
  ].filter(Boolean).length;

  const clearAll = () =>
    push({
      q: "",
      subject: "",
      language: "",
      style: "",
      availability: "",
      maxPrice: "",
      minRating: "",
      mode: "",
      verified: "",
    });

  const filterPanel = (
    <div className="space-y-5">
      <div>
        <label className="label" htmlFor="f-subject">Subject</label>
        <select
          id="f-subject"
          className="input"
          value={current.subject}
          onChange={(e) => push({ subject: e.target.value })}
        >
          <option value="">All subjects</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="f-language">Language</label>
        <select
          id="f-language"
          className="input"
          value={current.language}
          onChange={(e) => push({ language: e.target.value })}
        >
          <option value="">All languages</option>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="f-style">Handwriting style</label>
        <select
          id="f-style"
          className="input"
          value={current.style}
          onChange={(e) => push({ style: e.target.value })}
        >
          <option value="">Any style</option>
          {HANDWRITING_STYLES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="f-availability">Availability</label>
        <select
          id="f-availability"
          className="input"
          value={current.availability}
          onChange={(e) => push({ availability: e.target.value })}
        >
          <option value="">Any availability</option>
          {AVAILABILITY.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="f-rating">Minimum rating</label>
        <select
          id="f-rating"
          className="input"
          value={current.minRating}
          onChange={(e) => push({ minRating: e.target.value })}
        >
          <option value="">Any rating</option>
          <option value="4.5">4.5 & above</option>
          <option value="4">4.0 & above</option>
          <option value="3.5">3.5 & above</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor="f-price">Max price per page (₹)</label>
        <input
          id="f-price"
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="e.g. 10"
          className="input"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>

      <div>
        <span className="label">Work type</span>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-ink-50 p-1">
          {MODE_OPTIONS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => push({ mode: m.value })}
              className={cn(
                "rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                current.mode === m.value
                  ? "bg-paper text-ink-900 shadow-sm"
                  : "text-ink-500 hover:text-ink-700"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700">
        <input
          type="checkbox"
          className="h-4 w-4 rounded accent-accent-600"
          checked={current.verified === "1"}
          onChange={(e) => push({ verified: e.target.checked ? "1" : "" })}
        />
        Identity-verified writers only
      </label>

      {activeFilters > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="btn-ghost btn-sm w-full justify-center text-ink-500"
        >
          <X size={13} /> Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="container-x pb-20">
      {/* Prominent search bar overlapping the hero */}
      <div className="relative z-10 -mt-8">
        <div className="card flex items-center gap-3 p-2 pl-5 shadow-lift">
          <Search size={18} className="shrink-0 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search note writers, subjects…"
            aria-label="Search note writers, subjects"
            className="h-11 w-full bg-transparent text-[15px] text-ink-900 outline-none placeholder:text-ink-300"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-400 hover:bg-ink-50 hover:text-ink-700"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 lg:grid lg:grid-cols-[250px_1fr] lg:gap-10">
        {/* Mobile filter toggle */}
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="btn-outline btn-md mb-5 w-full justify-center lg:hidden"
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilters > 0 && (
            <span className="pill bg-accent-600 text-white">{activeFilters}</span>
          )}
        </button>

        <aside
          className={cn(
            "mb-8 lg:mb-0 lg:block",
            showFilters ? "block" : "hidden"
          )}
        >
          <div className="card p-5 lg:sticky lg:top-6">{filterPanel}</div>
        </aside>

        <div aria-busy={isPending}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p
              className={cn(
                "text-sm text-ink-500 transition-opacity",
                isPending && "opacity-50"
              )}
            >
              <span className="font-semibold text-ink-900">{count}</span>{" "}
              {count === 1 ? "writer" : "writers"} found
            </p>
            <label className="flex items-center gap-2 text-sm text-ink-500">
              Sort by
              <select
                className="input w-auto py-1.5"
                value={current.sort}
                onChange={(e) => push({ sort: e.target.value })}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div
            className={cn(
              "transition-opacity",
              isPending && "pointer-events-none opacity-60"
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
