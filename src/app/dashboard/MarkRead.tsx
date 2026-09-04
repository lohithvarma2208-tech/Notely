"use client";

import { useEffect } from "react";

/**
 * Marks all of the user's notifications as read when the dashboard is
 * viewed. Renders nothing; the unread highlighting in the list reflects
 * the state at load time, and the navbar badge clears on next navigation.
 */
export default function MarkRead() {
  useEffect(() => {
    fetch("/api/notifications", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}
