"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Small switch that toggles a writer verification flag via the admin API. */
export default function VerifyToggle({
  userId,
  field,
  value,
  label,
}: {
  userId: string;
  field: "identityVerified" | "phoneVerified";
  value: boolean;
  label: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    setPending(true);
    try {
      await fetch(`/api/admin/users/${userId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value: !value }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="flex items-center gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        title={`${label}: ${value ? "verified" : "not verified"}`}
        onClick={toggle}
        disabled={pending}
        className={cn(
          "inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors disabled:opacity-50",
          value ? "bg-mint-500" : "bg-ink-200"
        )}
      >
        <span
          className={cn(
            "h-4 w-4 rounded-full bg-paper shadow transition-transform",
            value && "translate-x-4"
          )}
        />
      </button>
    </span>
  );
}
