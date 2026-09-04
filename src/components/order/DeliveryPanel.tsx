"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DELIVERY_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatKb, type DeliveryFile } from "./types";
import { Download, FileText, Loader2, Plus, Trash2, Truck, UploadCloud } from "lucide-react";

const FILE_TYPES = ["PDF", "DOCX", "PPTX", "IMAGE", "OTHER"] as const;

/** Read-only list of delivered files (download links). */
export function DeliveryFiles({ files }: { files: DeliveryFile[] }) {
  if (files.length === 0) return null;
  return (
    <ul className="space-y-2">
      {files.map((f, i) => (
        <li key={`${f.url}-${i}`}>
          <a
            href={f.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl border border-ink-100 bg-paper px-3.5 py-2.5 transition-colors hover:border-accent-300"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
              <FileText size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink-900">
                {f.fileName}
              </span>
              <span className="text-xs text-ink-400">
                {f.fileType}
                {formatKb(f.sizeKb) ? ` · ${formatKb(f.sizeKb)}` : ""}
              </span>
            </span>
            <Download size={15} className="shrink-0 text-ink-300" />
          </a>
        </li>
      ))}
    </ul>
  );
}

type FileRow = { fileName: string; url: string; fileType: string; sizeKb: string };

/**
 * Writer's delivery form, shown when submitting completed notes.
 * DIGITAL orders collect delivery file rows; PHYSICAL orders collect the
 * hand-off/courier status and a tracking reference. POSTs /submit.
 */
export default function DeliveryPanel({
  orderId,
  deliveryMethod,
  onDone,
}: {
  orderId: string;
  deliveryMethod: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<FileRow[]>([
    { fileName: "", url: "", fileType: "PDF", sizeKb: "" },
  ]);
  const [deliveryStatus, setDeliveryStatus] = useState("HANDED_OFF");
  const [trackingRef, setTrackingRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const digital = deliveryMethod === "DIGITAL";

  function setRow(i: number, patch: Partial<FileRow>) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    let payload: Record<string, unknown>;
    if (digital) {
      const files = rows
        .map((r) => ({
          fileName: r.fileName.trim(),
          url: r.url.trim(),
          fileType: r.fileType,
          sizeKb: Number(r.sizeKb) || 0,
        }))
        .filter((r) => r.fileName || r.url);
      if (files.length === 0 || files.some((f) => !f.fileName || !f.url)) {
        setError("Add at least one delivery file — each needs a name and a URL.");
        return;
      }
      payload = { deliveryFiles: files };
    } else {
      payload = {
        deliveryStatus,
        ...(trackingRef.trim() ? { trackingRef: trackingRef.trim() } : {}),
      };
    }
    setBusy(true);
    try {
      if (!digital) {
        // /submit transitions the order but only stores deliveryStatus; the
        // tracking reference is persisted via the dedicated /delivery endpoint.
        const dres = await fetch(`/api/orders/${orderId}/delivery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deliveryStatus,
            ...(trackingRef.trim() ? { trackingRef: trackingRef.trim() } : {}),
          }),
        });
        const ddata = (await dres.json().catch(() => ({}))) as { error?: string };
        if (!dres.ok) {
          setError(ddata.error ?? "Could not record the delivery details.");
          return;
        }
      }
      const res = await fetch(`/api/orders/${orderId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not submit the delivery.");
        return;
      }
      router.refresh();
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 rounded-2xl border border-ink-100 bg-cream/60 p-4">
      {digital ? (
        <>
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
            <UploadCloud size={13} /> Delivery files
          </p>
          <div className="space-y-3">
            {rows.map((r, i) => (
              <div key={i} className="rounded-xl border border-ink-100 bg-paper p-3">
                <div className="flex items-start gap-2">
                  <div className="grid flex-1 gap-2">
                    <input
                      className="input"
                      placeholder="File name, e.g. Java_Module2_final.pdf"
                      value={r.fileName}
                      onChange={(e) => setRow(i, { fileName: e.target.value })}
                    />
                    <input
                      className="input"
                      placeholder="File URL (paste a link, e.g. from /uploads)"
                      value={r.url}
                      onChange={(e) => setRow(i, { url: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <select
                        className="input w-28"
                        value={r.fileType}
                        onChange={(e) => setRow(i, { fileType: e.target.value })}
                      >
                        {FILE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <input
                        className="input w-28"
                        type="number"
                        min={0}
                        placeholder="Size (KB)"
                        value={r.sizeKb}
                        onChange={(e) => setRow(i, { sizeKb: e.target.value })}
                      />
                    </div>
                  </div>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                      className="btn-ghost btn-sm px-2 text-ink-400 hover:text-red-600"
                      aria-label="Remove file"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setRows((prev) => [...prev, { fileName: "", url: "", fileType: "PDF", sizeKb: "" }])
            }
            className="btn-outline btn-sm mt-3"
          >
            <Plus size={13} /> Add another file
          </button>
        </>
      ) : (
        <>
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
            <Truck size={13} /> Physical delivery
          </p>
          <div className="grid gap-3">
            <div>
              <label className="label" htmlFor="delivery-status">
                Delivery status
              </label>
              <select
                id="delivery-status"
                className="input"
                value={deliveryStatus}
                onChange={(e) => setDeliveryStatus(e.target.value)}
              >
                {DELIVERY_STATUSES.filter((s) => s.value !== "PENDING").map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="tracking-ref">
                Tracking / hand-off reference{" "}
                <span className="normal-case text-ink-300">(optional)</span>
              </label>
              <input
                id="tracking-ref"
                className="input"
                placeholder="e.g. Courier AWB number, or 'Handed over at main gate'"
                value={trackingRef}
                onChange={(e) => setTrackingRef(e.target.value)}
                maxLength={200}
              />
            </div>
          </div>
        </>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary btn-md flex-1">
          {busy && <Loader2 size={15} className="animate-spin" />}
          Submit delivery
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={busy}
          className={cn("btn-ghost btn-md")}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
