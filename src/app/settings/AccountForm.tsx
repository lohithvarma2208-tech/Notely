"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, LogOut } from "lucide-react";

export default function AccountForm({
  initialName,
  initialPhone,
  initialCollege,
}: {
  initialName: string;
  initialPhone: string;
  initialCollege: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [college, setCollege] = useState(initialCollege);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, college }),
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
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="label">Full name</label>
        <input
          id="name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={2}
          maxLength={60}
          required
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="label">Phone</label>
          <input
            id="phone"
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98XXX XXXXX"
            maxLength={20}
          />
        </div>
        <div>
          <label htmlFor="college" className="label">College</label>
          <input
            id="college"
            className="input"
            value={college}
            onChange={(e) => setCollege(e.target.value)}
            placeholder="e.g. IIIT Hyderabad"
            maxLength={120}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
      )}
      {saved && !error && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-mint-600">
          <CheckCircle2 size={15} /> Saved
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary btn-md">
          {saving && <Loader2 size={15} className="animate-spin" />}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

export function LogoutButton() {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <button
      onClick={logout}
      disabled={busy}
      className="btn-outline btn-md w-full text-red-600 hover:border-red-200 hover:bg-red-50"
    >
      {busy ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
      {busy ? "Logging out…" : "Log out"}
    </button>
  );
}
