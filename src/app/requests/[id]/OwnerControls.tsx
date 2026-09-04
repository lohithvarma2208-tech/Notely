"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, XCircle } from "lucide-react";

/** Owner-only controls: edit budget/deadline/instructions, or cancel the request. */
export default function OwnerControls({
  requestId,
  budgetMin,
  budgetMax,
  deadline,
  instructions,
}: {
  requestId: string;
  budgetMin: number;
  budgetMax: number;
  deadline: string; // ISO
  instructions: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toLocalInput = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  const [min, setMin] = useState(String(budgetMin));
  const [max, setMax] = useState(String(budgetMax));
  const [dl, setDl] = useState(toLocalInput(deadline));
  const [instr, setInstr] = useState(instructions);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return false;
      }
      router.refresh();
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const ok = await patch({
      budgetMin: Number(min),
      budgetMax: Number(max),
      deadline: new Date(dl).toISOString(),
      instructions: instr.trim(),
    });
    if (ok) setEditing(false);
  }

  async function cancel() {
    if (
      !window.confirm(
        "Cancel this request? Writers with pending offers will be notified and their offers declined."
      )
    )
      return;
    await patch({ status: "CANCELLED" });
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-2">
        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="btn-outline btn-sm w-full"
        >
          <Pencil size={13} /> Edit budget, deadline or brief
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={busy}
          className="btn-ghost btn-sm w-full text-red-600 hover:bg-red-50"
        >
          <XCircle size={13} />
          {busy ? "Cancelling…" : "Cancel this request"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="oc-min" className="label">
            Budget min (₹)
          </label>
          <input
            id="oc-min"
            type="number"
            min={1}
            step={10}
            className="input"
            value={min}
            onChange={(e) => setMin(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="oc-max" className="label">
            Budget max (₹)
          </label>
          <input
            id="oc-max"
            type="number"
            min={1}
            step={10}
            className="input"
            value={max}
            onChange={(e) => setMax(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label htmlFor="oc-deadline" className="label">
          Deadline
        </label>
        <input
          id="oc-deadline"
          type="datetime-local"
          className="input"
          value={dl}
          onChange={(e) => setDl(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="oc-instr" className="label">
          Instructions
        </label>
        <textarea
          id="oc-instr"
          rows={4}
          maxLength={5000}
          className="input resize-y"
          value={instr}
          onChange={(e) => setInstr(e.target.value)}
        />
      </div>
      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary btn-sm flex-1">
          {busy ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setError(null);
          }}
          className="btn-ghost btn-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
