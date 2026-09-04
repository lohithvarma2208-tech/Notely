"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Plus, X } from "lucide-react";
import { LANGUAGES, SUBJECTS, HANDWRITING_STYLES, AVAILABILITY } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type WriterProfileData = {
  title: string;
  bio: string;
  location: string;
  languages: string[];
  subjects: string[];
  handwritingStyles: string[];
  pricePerPage: number;
  digitalPricePerPage: number;
  minOrderValue: number;
  availability: string;
  turnaroundDays: number;
  acceptsDigital: boolean;
  acceptsHandwritten: boolean;
};

const AVAILABILITY_HELP: Record<string, string> = {
  AVAILABLE: "You're shown first in search and can accept orders right away.",
  BUSY: "You still appear in search, but students see you may reply slower.",
  AWAY: "Your profile stays visible, but you're marked as not taking work.",
};

function Chip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm transition-all active:scale-[0.97]",
        selected
          ? "border-ink-900 bg-ink-900 text-paper"
          : "border-ink-200 bg-paper text-ink-600 hover:border-ink-400"
      )}
    >
      {label}
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  title,
  body,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={cn(
        "flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-all",
        checked ? "border-accent-300 bg-accent-50/50" : "border-ink-200 bg-paper hover:border-ink-300"
      )}
    >
      <span>
        <span className="block text-sm font-semibold text-ink-900">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">{body}</span>
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent-600" : "bg-ink-200"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all",
            checked ? "left-[22px]" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}

export default function WriterProfileForm({
  initial,
}: {
  initial: WriterProfileData | null;
}) {
  const router = useRouter();
  const isNew = !initial;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [languages, setLanguages] = useState<string[]>(initial?.languages ?? []);
  const [subjects, setSubjects] = useState<string[]>(initial?.subjects ?? []);
  const [customSubject, setCustomSubject] = useState("");
  const [hwStyles, setHwStyles] = useState<string[]>(initial?.handwritingStyles ?? []);
  const [pricePerPage, setPricePerPage] = useState(String(initial?.pricePerPage ?? 8));
  const [digitalPrice, setDigitalPrice] = useState(String(initial?.digitalPricePerPage ?? 5));
  const [minOrder, setMinOrder] = useState(String(initial?.minOrderValue ?? 100));
  const [availability, setAvailability] = useState(initial?.availability ?? "AVAILABLE");
  const [turnaround, setTurnaround] = useState(String(initial?.turnaroundDays ?? 2));
  const [acceptsDigital, setAcceptsDigital] = useState(initial?.acceptsDigital ?? true);
  const [acceptsHandwritten, setAcceptsHandwritten] = useState(initial?.acceptsHandwritten ?? true);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const toggleIn = (list: string[], setList: (v: string[]) => void, value: string) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  function addCustomSubject() {
    const v = customSubject.trim();
    if (!v) return;
    if (!subjects.some((s) => s.toLowerCase() === v.toLowerCase())) {
      setSubjects([...subjects, v]);
    }
    setCustomSubject("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    const res = await fetch("/api/profile/writer", {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        bio,
        location,
        languages,
        subjects,
        handwritingStyles: hwStyles,
        pricePerPage: Number(pricePerPage),
        digitalPricePerPage: Number(digitalPrice),
        minOrderValue: Number(minOrder),
        availability,
        turnaroundDays: Number(turnaround),
        acceptsDigital,
        acceptsHandwritten,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not save. Please try again.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* ---------- Basics ---------- */}
      <section className="card p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold text-ink-950">The basics</h2>
        <p className="mb-6 mt-1 text-sm text-ink-500">
          This is what students read before comparing your samples.
        </p>
        <div className="space-y-5">
          <div>
            <label htmlFor="title" className="label">Profile headline</label>
            <input
              id="title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Engineering notes specialist"
              maxLength={80}
              required
            />
          </div>
          <div>
            <label htmlFor="bio" className="label">Bio</label>
            <textarea
              id="bio"
              className="input min-h-28 resize-y"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What do you study, how long have you been writing notes, what makes yours worth paying for?"
              maxLength={1500}
            />
            <p className="mt-1.5 text-right text-xs text-ink-300">{bio.length}/1500</p>
          </div>
          <div className="sm:max-w-xs">
            <label htmlFor="location" className="label">Location</label>
            <input
              id="location"
              className="input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Hyderabad"
              maxLength={80}
            />
          </div>
        </div>
      </section>

      {/* ---------- Skills ---------- */}
      <section className="card p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold text-ink-950">What you write</h2>
        <p className="mb-6 mt-1 text-sm text-ink-500">
          Subjects and styles students can filter by.
        </p>

        <div className="space-y-7">
          <div>
            <span className="label">Languages</span>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <Chip
                  key={l}
                  label={l}
                  selected={languages.includes(l)}
                  onToggle={() => toggleIn(languages, setLanguages, l)}
                />
              ))}
            </div>
          </div>

          <div>
            <span className="label">Subjects</span>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  selected={subjects.includes(s)}
                  onToggle={() => toggleIn(subjects, setSubjects, s)}
                />
              ))}
              {subjects
                .filter((s) => !(SUBJECTS as readonly string[]).includes(s))
                .map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink-900 bg-ink-900 py-1.5 pl-3.5 pr-2 text-sm text-paper"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => setSubjects(subjects.filter((x) => x !== s))}
                      className="rounded-full p-0.5 hover:bg-paper/20"
                      aria-label={`Remove ${s}`}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
            </div>
            <div className="mt-3 flex max-w-sm gap-2">
              <input
                className="input"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomSubject();
                  }
                }}
                placeholder="Add another subject…"
                maxLength={60}
              />
              <button
                type="button"
                onClick={addCustomSubject}
                className="btn-outline btn-md shrink-0"
              >
                <Plus size={15} /> Add
              </button>
            </div>
          </div>

          <div>
            <span className="label">Handwriting styles</span>
            <div className="flex flex-wrap gap-2">
              {HANDWRITING_STYLES.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  selected={hwStyles.includes(s)}
                  onToggle={() => toggleIn(hwStyles, setHwStyles, s)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Pricing & availability ---------- */}
      <section className="card p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold text-ink-950">Pricing & availability</h2>
        <p className="mb-6 mt-1 text-sm text-ink-500">
          Set honest rates — students compare these side by side.
        </p>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="ppp" className="label">₹ per handwritten page</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-400">₹</span>
              <input
                id="ppp"
                type="number"
                min={1}
                max={500}
                className="input pl-7"
                value={pricePerPage}
                onChange={(e) => setPricePerPage(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="dpp" className="label">₹ per digital page</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-400">₹</span>
              <input
                id="dpp"
                type="number"
                min={1}
                max={500}
                className="input pl-7"
                value={digitalPrice}
                onChange={(e) => setDigitalPrice(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="mov" className="label">Minimum order value</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-400">₹</span>
              <input
                id="mov"
                type="number"
                min={0}
                max={100000}
                className="input pl-7"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <div>
            <span className="label">Availability</span>
            <div className="flex overflow-hidden rounded-xl border border-ink-200">
              {AVAILABILITY.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setAvailability(a.value)}
                  aria-pressed={availability === a.value}
                  className={cn(
                    "flex-1 px-3 py-2.5 text-sm font-medium transition-colors",
                    availability === a.value
                      ? "bg-ink-900 text-paper"
                      : "bg-paper text-ink-600 hover:bg-ink-50"
                  )}
                >
                  {a.value === "AVAILABLE" ? "Available" : a.value === "BUSY" ? "Busy" : "Away"}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-400">
              {AVAILABILITY_HELP[availability]}
            </p>
          </div>
          <div>
            <label htmlFor="tat" className="label">Typical turnaround (days)</label>
            <input
              id="tat"
              type="number"
              min={1}
              max={30}
              className="input"
              value={turnaround}
              onChange={(e) => setTurnaround(e.target.value)}
              required
            />
            <p className="mt-2 text-xs leading-relaxed text-ink-400">
              Roughly how long you take per 40 pages. Students see this before ordering.
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <Toggle
            checked={acceptsHandwritten}
            onChange={setAcceptsHandwritten}
            title="Handwritten notes"
            body="Physical notebook work — copying, rewriting, notebook completion."
          />
          <Toggle
            checked={acceptsDigital}
            onChange={setAcceptsDigital}
            title="Digital notes"
            body="Typed, scanned or cleaned-up PDF/DOCX notes delivered online."
          />
        </div>
      </section>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
      )}
      {saved && !error && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-mint-600">
          <CheckCircle2 size={15} /> {isNew ? "Profile created — welcome aboard!" : "Saved"}
        </p>
      )}

      <div className="sticky bottom-4 flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary btn-lg shadow-lift">
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? "Saving…" : isNew ? "Create my writer profile" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
