import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate, inr } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";
import StatusPill from "@/components/StatusPill";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin orders",
  description: "All marketplace orders, newest first.",
};

export default async function AdminOrdersPage() {
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      request: { select: { title: true } },
      student: { select: { name: true } },
      writer: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
          Orders
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {orders.length.toLocaleString("en-IN")} most recent order
          {orders.length === 1 ? "" : "s"} — read-only.
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          body="Orders appear here once a student accepts a note writer's offer and pays."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3.5">Order</th>
                <th className="px-4 py-3.5">Request</th>
                <th className="px-4 py-3.5">Student</th>
                <th className="px-4 py-3.5">Writer</th>
                <th className="px-4 py-3.5 text-right">Agreed price</th>
                <th className="px-4 py-3.5 text-right">Platform fee</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {orders.map((o) => (
                <tr key={o.id} className="transition-colors hover:bg-ink-50/50">
                  <td className="px-5 py-3.5 font-mono text-xs text-ink-500">
                    #{o.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-ink-900">
                    {o.request.title}
                  </td>
                  <td className="px-4 py-3.5 text-ink-600">{o.student.name}</td>
                  <td className="px-4 py-3.5 text-ink-600">{o.writer.name}</td>
                  <td className="px-4 py-3.5 text-right font-semibold text-ink-950">
                    {inr(o.agreedPrice)}
                  </td>
                  <td className="px-4 py-3.5 text-right text-ink-500">
                    {inr(o.platformFee)}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusPill status={o.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right text-ink-500">
                    {formatDate(o.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
