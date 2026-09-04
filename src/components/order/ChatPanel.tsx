"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import { cn, timeAgo } from "@/lib/utils";
import type { ChatMessage } from "./types";
import {
  FileText,
  Loader2,
  MessageSquare,
  Paperclip,
  Send,
  X,
} from "lucide-react";

const POLL_MS = 5000;

export default function ChatPanel({
  orderId,
  viewerId,
  otherPartyName,
}: {
  orderId: string;
  viewerId: string;
  otherPartyName: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [body, setBody] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentType, setAttachmentType] = useState<"DOCUMENT" | "IMAGE">("DOCUMENT");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { messages: ChatMessage[] };
      let msgs = data.messages;
      // When the order room is visible, incoming messages are marked read right
      // away; otherwise they keep an unread dot until the user returns.
      if (document.visibilityState === "visible") {
        const hasUnread = msgs.some((m) => m.senderId !== viewerId && !m.readAt);
        if (hasUnread) {
          const now = new Date().toISOString();
          msgs = msgs.map((m) =>
            m.senderId !== viewerId && !m.readAt ? { ...m, readAt: now } : m
          );
          void fetch(`/api/orders/${orderId}/messages`, { method: "PATCH" });
        }
      }
      setMessages(msgs);
    } catch {
      // transient network error — next poll retries
    }
  }, [orderId, viewerId]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && (messages?.length ?? 0) !== lastCount.current) {
      lastCount.current = messages?.length ?? 0;
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const unreadIncoming =
    messages?.filter((m) => m.senderId !== viewerId && !m.readAt).length ?? 0;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const text = body.trim();
    const url = attachmentUrl.trim();
    if (!text && !url) return;
    setSending(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: text,
          ...(url ? { attachmentUrl: url, attachmentType } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: ChatMessage;
      };
      if (!res.ok || !data.message) {
        setError(data.error ?? "Message could not be sent.");
        return;
      }
      setMessages((prev) => (prev ? [...prev, data.message as ChatMessage] : [data.message as ChatMessage]));
      setBody("");
      setAttachmentUrl("");
      setAttachOpen(false);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="card overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-ink-100 px-6 py-4">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-ink-950">
          <MessageSquare size={19} className="text-accent-600" /> Order chat
        </h2>
        <div className="flex items-center gap-2 text-xs text-ink-400">
          {unreadIncoming > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-accent-50 px-2.5 py-1 font-medium text-accent-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-600" />
              {unreadIncoming} new
            </span>
          )}
          <span className="hidden sm:inline">Private between you and {otherPartyName}</span>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="ruled-paper nice-scroll h-[380px] space-y-4 overflow-y-auto px-4 py-5 sm:px-6"
      >
        {messages === null ? (
          <p className="flex h-full items-center justify-center gap-2 text-sm text-ink-400">
            <Loader2 size={15} className="animate-spin" /> Loading chat…
          </p>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-paper text-ink-300 shadow-card">
              <MessageSquare size={19} />
            </span>
            <p className="max-w-xs text-sm text-ink-400">
              No messages yet. Say hello and align on sources, style and hand-off details.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === viewerId;
            const unread = !mine && !m.readAt;
            return (
              <div
                key={m.id}
                className={cn("flex items-end gap-2", mine && "flex-row-reverse")}
              >
                <Avatar name={m.sender.name} url={m.sender.avatarUrl} size={26} />
                <div className={cn("max-w-[78%] sm:max-w-[70%]", mine && "text-right")}>
                  <div
                    className={cn(
                      "inline-block rounded-2xl px-3.5 py-2 text-left text-sm leading-relaxed shadow-card",
                      mine
                        ? "rounded-br-md bg-ink-900 text-paper"
                        : "rounded-bl-md border border-ink-100 bg-paper text-ink-800"
                    )}
                  >
                    {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                    {m.attachmentUrl && m.attachmentType === "IMAGE" && (
                      <a href={m.attachmentUrl} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.attachmentUrl}
                          alt="Attachment"
                          className={cn("max-h-40 rounded-lg", m.body && "mt-2")}
                        />
                      </a>
                    )}
                    {m.attachmentUrl && m.attachmentType !== "IMAGE" && (
                      <a
                        href={m.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium",
                          m.body && "mt-2",
                          mine
                            ? "bg-ink-800 text-paper hover:bg-ink-700"
                            : "bg-ink-50 text-ink-700 hover:bg-ink-100"
                        )}
                      >
                        <FileText size={13} />
                        <span className="max-w-[180px] truncate">
                          {m.attachmentUrl.split("/").pop() || "Attachment"}
                        </span>
                      </a>
                    )}
                  </div>
                  <p
                    className={cn(
                      "mt-1 flex items-center gap-1.5 text-[10px] text-ink-400",
                      mine && "justify-end"
                    )}
                  >
                    {unread && <span className="h-1.5 w-1.5 rounded-full bg-accent-600" />}
                    {timeAgo(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={send} className="border-t border-ink-100 bg-paper px-4 py-3 sm:px-6">
        {attachOpen && (
          <div className="mb-2 flex flex-col gap-2 rounded-xl bg-ink-50/70 p-2.5 sm:flex-row">
            <input
              className="input flex-1"
              placeholder="Paste a file or photo link (e.g. /uploads/notes.pdf)"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
            />
            <select
              className="input sm:w-36"
              value={attachmentType}
              onChange={(e) => setAttachmentType(e.target.value as "DOCUMENT" | "IMAGE")}
            >
              <option value="DOCUMENT">Document</option>
              <option value="IMAGE">Image</option>
            </select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAttachOpen((v) => !v)}
            className={cn(
              "btn-ghost btn-md shrink-0 px-2.5",
              attachOpen && "bg-ink-100/70 text-ink-900"
            )}
            aria-label={attachOpen ? "Remove attachment" : "Attach a link"}
          >
            {attachOpen ? <X size={16} /> : <Paperclip size={16} />}
          </button>
          <input
            className="input flex-1"
            placeholder={`Message ${otherPartyName}…`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={sending || (!body.trim() && !attachmentUrl.trim())}
            className="btn-primary btn-md shrink-0 px-4"
            aria-label="Send message"
          >
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>
    </section>
  );
}
