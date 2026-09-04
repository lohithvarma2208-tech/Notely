"use client";

import { useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

export default function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, passcode }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      // Hard navigate so the admin layout re-renders with the new session.
      window.location.href = "/admin";
    } catch {
      setError("Network error — please check your connection and try again.");
      setLoading(false);
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

      <div>
        <label htmlFor="admin-email" className="label">
          Admin email
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="username"
          required
          className="input"
          placeholder="admin@notely.in"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="admin-passcode" className="label">
          Passcode
        </label>
        <div className="relative">
          <input
            id="admin-passcode"
            type={showPasscode ? "text" : "password"}
            autoComplete="current-password"
            required
            className="input pr-11"
            placeholder="Your admin passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPasscode((s) => !s)}
            aria-label={showPasscode ? "Hide passcode" : "Show passcode"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
          >
            {showPasscode ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary btn-md w-full">
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Verifying…
          </>
        ) : (
          <>
            <ShieldCheck size={16} /> Log in to admin
          </>
        )}
      </button>
    </form>
  );
}
