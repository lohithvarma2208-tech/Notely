"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export default function AdminLogoutButton() {
  const [pending, setPending] = useState(false);

  async function logout() {
    if (pending) return;
    setPending(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      // Hard navigate so the admin session is re-evaluated from scratch.
      window.location.href = "/admin/login";
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      className="btn-outline btn-sm"
    >
      <LogOut size={14} /> Log out
    </button>
  );
}
