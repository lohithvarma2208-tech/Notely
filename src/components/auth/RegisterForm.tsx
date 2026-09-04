"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  Check,
  Eye,
  EyeOff,
  Loader2,
  PenLine,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Intent = "student" | "writer";

const INTENTS: Array<{
  value: Intent;
  icon: typeof BookOpen;
  title: string;
  body: string;
}> = [
  {
    value: "student",
    icon: BookOpen,
    title: "I need notes written",
    body: "Post requests, compare offers and get neat, exam-ready notes.",
  },
  {
    value: "writer",
    icon: PenLine,
    title: "I want to earn writing notes",
    body: "Turn your neat handwriting into income, on your own schedule.",
  },
];

export default function RegisterForm({ initialIntent }: { initialIntent: Intent }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [college, setCollege] = useState("");
  const [intent, setIntent] = useState<Intent>(initialIntent);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          college: college || undefined,
          intent,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      // Hard navigate so the navbar re-renders with the new session.
      window.location.href = "/dashboard";
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

      {/* Account intent chooser */}
      <fieldset>
        <legend className="label">I&apos;m here to…</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {INTENTS.map((opt) => {
            const selected = intent === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setIntent(opt.value)}
                aria-pressed={selected}
                className={cn(
                  "relative rounded-2xl border p-4 text-left transition-all",
                  selected
                    ? "border-accent-500 bg-accent-50 ring-2 ring-accent-100"
                    : "border-ink-200 bg-paper hover:border-ink-400"
                )}
              >
                {selected && (
                  <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-accent-600 text-white">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
                <span
                  className={cn(
                    "mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl",
                    selected ? "bg-accent-600 text-white" : "bg-ink-100 text-ink-600"
                  )}
                >
                  <opt.icon size={17} />
                </span>
                <p className="text-sm font-semibold text-ink-900">{opt.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-500">{opt.body}</p>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="name" className="label">
          Full name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          required
          className="input"
          placeholder="Priya Sharma"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          className="input"
          placeholder="you@college.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            className="input pr-11"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-ink-400">Minimum 8 characters.</p>
      </div>

      <div>
        <label htmlFor="college" className="label">
          College <span className="font-normal normal-case text-ink-300">(optional)</span>
        </label>
        <input
          id="college"
          type="text"
          autoComplete="organization"
          className="input"
          placeholder="e.g. VIT Vellore"
          value={college}
          onChange={(e) => setCollege(e.target.value)}
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary btn-md w-full">
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Creating your account…
          </>
        ) : intent === "writer" ? (
          "Create account & start earning"
        ) : (
          "Create account"
        )}
      </button>

      <p className="text-center text-xs leading-relaxed text-ink-400">
        Notely is for note writing, preparation, organization and digitization
        only — not for completing graded assignments or exams.
      </p>

      <p className="text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent-700 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
