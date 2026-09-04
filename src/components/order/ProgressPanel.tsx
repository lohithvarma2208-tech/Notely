"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "@/components/ProgressBar";
import { timeAgo } from "@/lib/utils";
import type { ProgressEntry } from "./types";
import { Camera, ListChecks, Loader2, Send } from "lucide-react";

export default function ProgressPanel({
  orderId,
  status,
  isWriter,
  totalPages,
  pagesCompleted,
  updates,
}: {
  orderId: string;
  status: string;
  isWriter: boolean;
  totalPages: number;
  pagesCompleted: number;
  updates: ProgressEntry[];
}) {
  const router = useRouter();
  const canUpdate = isWriter && status === "IN_PROGRESS";

  const [pages, setPages] = useState(String(pagesCompleted));
  const [note, setNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = Number(pages);
    if (!Number.isFinite(n) || n < 0 || n > totalPages) {
      setError(`Pages completed must be between 0 and ${totalPages}.`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pagesCompleted: n,
          note: note.trim(),
          ...(photoUrl.trim() ? { photoUrl: photoUrl.trim() } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not post the progress update.");
        return;
      }
      setNote("");
      setPhotoUrl("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-ink-950">
          <ListChecks size={19} className="text-accent-600" /> Progress
        </h2>
        <span className="text-sm text-ink-500">
          <span className="font-semibold text-ink-900">{pagesCompleted}</span>
          {" / "}
          {totalPages} pages
        </span>
      </div>

      <ProgressBar done={pagesCompleted} total={totalPages} height={12} />

      {canUpdate && (
        <form
          onSubmit={submit}
          className="mt-5 rounded-2xl border border-accent-100 bg-accent-50/50 p-4"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-accent-700">
            Post a progress update
          </p>
          <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
            <div>
              <label className="label" htmlFor="progress-pages">
                Pages done
              </label>
              <input
                id="progress-pages"
                type="number"
                min={0}
                max={totalPages}
                className="input"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="progress-note">
                Note for the student
              </label>
              <input
                id="progress-note"
                className="input"
                placeholder="e.g. Finished the collections chapter, starting diagrams"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
              />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="label" htmlFor="progress-photo">
                Photo URL <span className="normal-case text-ink-300">(optional)</span>
              </label>
              <input
                id="progress-photo"
                className="input"
                placeholder="Paste a link to a progress photo (e.g. from /uploads)"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
              />
            </div>
            <button type="submit" disabled={busy} className="btn-primary btn-md shrink-0">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Post update
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </form>
      )}

      <div className="mt-6">
        {updates.length === 0 ? (
          <p className="rounded-xl bg-ink-50/70 px-4 py-6 text-center text-sm text-ink-400">
            No progress updates yet — they&apos;ll appear here as pages get written.
          </p>
        ) : (
          <ol className="relative space-y-5 border-l border-ink-100 pl-5">
            {updates.map((u) => (
              <li key={u.id} className="relative">
                <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-accent-500" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="pill bg-accent-50 text-accent-700">
                    {u.pagesCompleted} page{u.pagesCompleted === 1 ? "" : "s"} done
                  </span>
                  <span className="text-xs text-ink-400">{timeAgo(u.createdAt)}</span>
                </div>
                {u.note && (
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{u.note}</p>
                )}
                {u.photoUrl && (
                  <a
                    href={u.photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-start gap-1.5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u.photoUrl}
                      alt="Progress photo"
                      className="h-24 w-auto rounded-lg border border-ink-100 object-cover"
                    />
                    <Camera size={13} className="mt-1 text-ink-300" />
                  </a>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
