"use client";

import { useState } from "react";
import { Phone, KeyRound, Loader2, RefreshCw } from "lucide-react";

type Stage = "phone" | "code";

export default function PhoneOtpForm({ next }: { next: string }) {
  const [stage, setStage] = useState<Stage>("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Could not send OTP");
    setDevOtp(data.devOtp ?? null);
    setStage("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code, name: name || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBusy(false);
      return setError(data.error ?? "Verification failed");
    }
    window.location.href = next;
  }

  return (
    <div>
      {stage === "phone" ? (
        <form onSubmit={requestOtp} className="space-y-4">
          <div>
            <label htmlFor="otp-name" className="label">
              Your name <span className="font-normal text-ink-300">(new accounts)</span>
            </label>
            <input
              id="otp-name"
              className="input"
              placeholder="e.g. Rahul Verma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="otp-phone" className="label">
              Phone number
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
              <input
                id="otp-phone"
                className="input pl-9"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
                required
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary btn-md w-full">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={15} />}
            Send OTP
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          <p className="text-sm text-ink-500">
            Enter the 6-digit code sent to{" "}
            <span className="font-semibold text-ink-900">{phone}</span>
          </p>
          {devOtp && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Dev mode (no SMS provider configured) — your OTP is{" "}
              <span className="font-mono font-bold tracking-widest">{devOtp}</span>
            </p>
          )}
          <div>
            <label htmlFor="otp-code" className="label">
              One-time password
            </label>
            <input
              id="otp-code"
              className="input text-center font-mono text-lg tracking-[0.5em]"
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy || code.length !== 6} className="btn-primary btn-md w-full">
            {busy && <Loader2 size={16} className="animate-spin" />}
            Verify & continue
          </button>
          <button
            type="button"
            onClick={() => {
              setStage("phone");
              setCode("");
              setError(null);
            }}
            className="btn-ghost btn-sm mx-auto flex items-center gap-1.5"
          >
            <RefreshCw size={13} /> Change number / resend
          </button>
        </form>
      )}
    </div>
  );
}
