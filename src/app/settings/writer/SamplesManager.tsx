"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SampleCard from "@/components/SampleCard";
import { SAMPLE_STYLES, type SampleStyle } from "@/lib/constants";
import { HAND_FONTS, cn } from "@/lib/utils";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

export type SampleData = {
  id: string;
  title: string;
  style: string;
  fontKey: string;
  sampleText: string;
  sortOrder: number;
};

const FONT_PREVIEW_SENTENCE = "The quick brown fox jumps over the lazy dog — 1, 2, 3!";

const EMPTY_FORM = {
  title: "",
  style: "NEAT" as SampleStyle,
  fontKey: "hand2",
  sampleText: "",
};

export default function SamplesManager({ samples }: { samples: SampleData[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState(EMPTY_FORM.title);
  const [style, setStyle] = useState<SampleStyle>(EMPTY_FORM.style);
  const [fontKey, setFontKey] = useState(EMPTY_FORM.fontKey);
  const [sampleText, setSampleText] = useState(EMPTY_FORM.sampleText);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function openCreate() {
    setEditingId(null);
    setTitle(EMPTY_FORM.title);
    setStyle(EMPTY_FORM.style);
    setFontKey(EMPTY_FORM.fontKey);
    setSampleText(EMPTY_FORM.sampleText);
    setError("");
    setFormOpen(true);
  }

  function openEdit(s: SampleData) {
    setEditingId(s.id);
    setTitle(s.title);
    setStyle(s.style as SampleStyle);
    setFontKey(s.fontKey);
    setSampleText(s.sampleText);
    setError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setError("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/profile/samples", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        editingId
          ? { id: editingId, title, style, fontKey, sampleText }
          : { title, style, fontKey, sampleText }
      ),
    });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not save the sample. Please try again.");
      return;
    }
    closeForm();
    router.refresh();
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this sample? Students will no longer see it.")) return;
    setDeletingId(id);
    setError("");
    const res = await fetch("/api/profile/samples", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeletingId(null);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not delete the sample. Please try again.");
      return;
    }
    if (editingId === id) closeForm();
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
      )}

      {/* ---------- Existing samples ---------- */}
      {samples.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p className="font-display text-lg font-semibold text-ink-900">No samples yet</p>
          <p className="max-w-md text-sm text-ink-500">
            Samples are how students judge your handwriting before ordering. Add
            at least two or three — math notation, headings and everyday writing
            work well.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {samples.map((s, i) => (
            <div key={s.id} className="space-y-3">
              <SampleCard
                title={s.title}
                fontKey={s.fontKey}
                sampleText={s.sampleText}
                tilt={i % 2 === 0 ? -0.6 : 0.6}
              />
              <div className="flex items-center justify-between gap-3 px-1">
                <span className="pill bg-ink-50 text-ink-500">
                  {SAMPLE_STYLES.find((x) => x.value === s.style)?.label ?? s.style}
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(s)}
                    className="btn-ghost btn-sm"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(s.id)}
                    disabled={deletingId === s.id}
                    className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                  >
                    {deletingId === s.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!formOpen && (
        <button type="button" onClick={openCreate} className="btn-outline btn-md">
          <Plus size={15} /> Add a sample
        </button>
      )}

      {/* ---------- Editor ---------- */}
      {formOpen && (
        <form
          onSubmit={onSubmit}
          className="card grid gap-8 p-6 sm:p-8 lg:grid-cols-2"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-ink-950">
                {editingId ? "Edit sample" : "New sample"}
              </h3>
              <button
                type="button"
                onClick={closeForm}
                className="btn-ghost btn-sm"
                aria-label="Close editor"
              >
                <X size={14} />
              </button>
            </div>

            <div>
              <label htmlFor="sample-title" className="label">Title</label>
              <input
                id="sample-title"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Mathematical notation"
                maxLength={80}
                required
              />
            </div>

            <div>
              <label htmlFor="sample-style" className="label">Style</label>
              <select
                id="sample-style"
                className="input"
                value={style}
                onChange={(e) => setStyle(e.target.value as SampleStyle)}
              >
                {SAMPLE_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="label">Writing style</span>
              <div className="grid gap-2">
                {Object.entries(HAND_FONTS).map(([key, font]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFontKey(key)}
                    aria-pressed={fontKey === key}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left transition-all",
                      fontKey === key
                        ? "border-accent-400 bg-accent-50/60 ring-2 ring-accent-100"
                        : "border-ink-200 bg-paper hover:border-ink-300"
                    )}
                  >
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                      {font.label}
                    </span>
                    <span className={cn("mt-0.5 block text-lg leading-snug text-ink-800", font.className)}>
                      {FONT_PREVIEW_SENTENCE}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="sample-text" className="label">Sample text</label>
              <textarea
                id="sample-text"
                className="input min-h-44 resize-y font-mono text-[13px]"
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                placeholder={"Chapter 4 — Laws of Motion\n\nNewton's Second Law:\nF = dp/dt = ma"}
                maxLength={2000}
                required
              />
              <p className="mt-1.5 text-right text-xs text-ink-300">
                {sampleText.length}/2000
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeForm} className="btn-ghost btn-md">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="btn-primary btn-md">
                {busy && <Loader2 size={15} className="animate-spin" />}
                {busy ? "Saving…" : editingId ? "Save sample" : "Add sample"}
              </button>
            </div>
          </div>

          {/* ---------- Live preview ---------- */}
          <div>
            <span className="label">Live preview — exactly what students see</span>
            <SampleCard
              title={title.trim() || "Untitled sample"}
              fontKey={fontKey}
              sampleText={
                sampleText ||
                "Start typing on the left and watch your handwriting appear here…"
              }
            />
          </div>
        </form>
      )}
    </div>
  );
}
