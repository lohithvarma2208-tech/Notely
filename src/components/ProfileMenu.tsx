"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "./Avatar";
import { LayoutDashboard, LogOut, Mail, Phone, Settings } from "lucide-react";

export default function ProfileMenu({
  name,
  email,
  phone,
}: {
  name: string;
  email: string;
  phone: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Your profile"
        aria-expanded={open}
        className="rounded-full transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
      >
        <Avatar name={name} size={34} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 animate-rise rounded-2xl border border-ink-100 bg-paper shadow-lift">
          {/* identity */}
          <div className="flex items-center gap-3 border-b border-ink-100 p-4">
            <Avatar name={name} size={44} />
            <div className="min-w-0">
              <p className="truncate font-display text-base font-semibold text-ink-900">
                {name}
              </p>
              <p className="truncate text-xs text-ink-400">Notely account</p>
            </div>
          </div>

          {/* details */}
          <div className="space-y-2.5 border-b border-ink-100 px-4 py-3.5 text-sm">
            <p className="flex items-center gap-2.5 text-ink-600">
              <Mail size={14} className="shrink-0 text-ink-300" />
              <span className="truncate">{email}</span>
            </p>
            <p className="flex items-center gap-2.5 text-ink-600">
              <Phone size={14} className="shrink-0 text-ink-300" />
              <span className="truncate">
                {phone ?? (
                  <span className="text-ink-400">Not added yet</span>
                )}
              </span>
            </p>
          </div>

          {/* actions */}
          <div className="p-2">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-50 hover:text-ink-900"
            >
              <LayoutDashboard size={15} className="text-accent-600" />
              Dashboard
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-50 hover:text-ink-900"
            >
              <Settings size={15} className="text-accent-600" />
              Account settings
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={15} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
