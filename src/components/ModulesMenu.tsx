"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  X,
  Home,
  Users,
  Briefcase,
  NotebookPen,
  PenLine,
  LayoutDashboard,
  Wallet,
  CreditCard,
  Settings,
  ShieldCheck,
  LogOut,
} from "lucide-react";

const GROUPS: Array<{
  heading: string;
  links: Array<{ label: string; href: string; icon: typeof Home; note?: string }>;
}> = [
  {
    heading: "Marketplace",
    links: [
      { label: "Home", href: "/", icon: Home },
      { label: "Browse Note Writers", href: "/writers", icon: Users },
      { label: "Handwriting Gallery", href: "/#samples", icon: PenLine },
      { label: "Post a Note Request", href: "/requests/new", icon: NotebookPen },
      { label: "Find Work", href: "/find-work", icon: Briefcase, note: "writers" },
    ],
  },
  {
    heading: "My Account",
    links: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Writer Dashboard", href: "/dashboard/writer", icon: PenLine },
      { label: "Earnings", href: "/earnings", icon: Wallet },
      { label: "Subscription", href: "/subscribe", icon: CreditCard },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
  {
    heading: "Admin",
    links: [{ label: "Admin Portal", href: "/admin", icon: ShieldCheck }],
  },
];

export default function ModulesMenu({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // close on route change
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // close on outside click / Escape
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
        aria-expanded={open}
        aria-label="Open modules menu"
        className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-paper px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 hover:text-ink-900"
      >
        {open ? <X size={16} /> : <LayoutGrid size={16} />}
        <span className="hidden sm:inline">Menu</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 animate-rise rounded-2xl border border-ink-100 bg-paper p-3 shadow-lift">
          {GROUPS.map((g) => (
            <div key={g.heading} className="mb-2 last:mb-0">
              <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                {g.heading}
              </p>
              {g.links.map((l) => (
                <Link
                  key={l.href + l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-50 hover:text-ink-900"
                >
                  <l.icon size={15} className="shrink-0 text-accent-600" />
                  <span className="flex-1">{l.label}</span>
                  {l.note && (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-ink-300">
                      {l.note}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ))}
          {loggedIn && (
            <div className="border-t border-ink-100 pt-2">
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut size={15} className="shrink-0" />
                <span className="flex-1 text-left">Log out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
