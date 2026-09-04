"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";

/**
 * Keys must stay in sync with the zod schema in
 * src/app/api/admin/config/route.ts — values are numeric strings, never
 * hardcoded anywhere in app code (see src/lib/config.ts).
 */
const FIELDS = [
  { key: "platformFeePercent", label: "Platform fee (%)", step: "0.1", min: 0 },
  {
    key: "subscriptionPriceInr",
    label: "Monthly subscription price (₹)",
    step: "1",
    min: 0,
  },
  {
    key: "subscriptionTrialDays",
    label: "Free trial length (days)",
    step: "1",
    min: 1,
  },
  { key: "minOfferRupees", label: "Minimum offer (₹)", step: "1", min: 0 },
  { key: "maxOfferRupees", label: "Maximum offer (₹)", step: "1", min: 0 },
] as const;

type ConfigKey = (typeof FIELDS)[number]["key"];

export default function ConfigEditor({
  initial,
}: {
  initial: Record<ConfigKey, string>;
}) {
  const [values, setValues] = useState<Record<ConfigKey, string>>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save — please try again.");
        setSaving(false);
        return;
      }
      setSaved(true);
      setSaving(false);
    } catch {
      setError("Network error — please check your connection and try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label htmlFor={`config-${f.key}`} className="label">
              {f.label}
            </label>
            <input
              id={`config-${f.key}`}
              type="number"
              inputMode="numeric"
              step={f.step}
              min={f.min}
              required
              className="input"
              value={values[f.key]}
              onChange={(e) => {
                setValues((v) => ({ ...v, [f.key]: e.target.value }));
                setSaved(false);
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary btn-md">
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save size={16} /> Save configuration
            </>
          )}
        </button>
        {saved && (
          <p
            role="status"
            className="flex items-center gap-1.5 text-sm font-medium text-mint-600"
          >
            <CheckCircle2 size={16} /> Saved — applies to new orders and trials
            right away.
          </p>
        )}
      </div>
    </form>
  );
}
