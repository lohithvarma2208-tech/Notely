import type { Metadata } from "next";
import { Search, SearchX } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSubscriptionState } from "@/lib/subscription";
import { cn, formatDate } from "@/lib/utils";
import Avatar from "@/components/Avatar";
import EmptyState from "@/components/EmptyState";
import VerifyToggle from "@/components/admin/VerifyToggle";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin users",
  description: "Search users and manage writer verification.",
};

const SUB_TONES: Record<string, string> = {
  TRIAL: "bg-accent-50 text-accent-700",
  ACTIVE: "bg-mint-50 text-mint-700",
  EXPIRED: "bg-red-50 text-red-600",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();

  const where: Prisma.UserWhereInput = q
    ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] }
    : {};

  const users = await db.user.findMany({
    where,
    include: { writerProfile: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Subscription state is computed from timestamps, never stored.
  const subs = await Promise.all(users.map((u) => getSubscriptionState(u)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
            Users
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {users.length.toLocaleString("en-IN")}
            {users.length === 100 ? "+" : ""} user
            {users.length === 1 ? "" : "s"}
            {q ? ` matching “${q}”` : ""}
          </p>
        </div>
        <form action="/admin/users" method="get" className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name or email"
            className="input w-56 sm:w-64"
            aria-label="Search users"
          />
          <button type="submit" className="btn-primary btn-md">
            <Search size={15} /> Search
          </button>
        </form>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={q ? "No users match that search" : "No users yet"}
          body={
            q
              ? "Try a different name or email, or clear the search to see everyone."
              : "Signed-up students and note writers will appear here."
          }
          ctaLabel={q ? "Clear search" : undefined}
          ctaHref={q ? "/admin/users" : undefined}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3.5">User</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">College</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Writer verification</th>
                <th className="px-4 py-3.5">Subscription</th>
                <th className="px-5 py-3.5 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {users.map((u, i) => {
                const sub = subs[i];
                return (
                  <tr
                    key={u.id}
                    className="transition-colors hover:bg-ink-50/50"
                  >
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-2.5">
                        <Avatar name={u.name} url={u.avatarUrl} size={32} />
                        <span className="font-medium text-ink-900">
                          {u.name}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-ink-600">{u.email}</td>
                    <td className="px-4 py-3.5 text-ink-500">
                      {u.college || "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      {u.writerProfile ? (
                        <span className="pill bg-accent-50 text-accent-700">
                          Writer
                        </span>
                      ) : (
                        <span className="pill bg-ink-100 text-ink-600">
                          Student
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {u.writerProfile ? (
                        <span className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                          <VerifyToggle
                            userId={u.id}
                            field="identityVerified"
                            value={u.writerProfile.identityVerified}
                            label="ID"
                          />
                          <VerifyToggle
                            userId={u.id}
                            field="phoneVerified"
                            value={u.writerProfile.phoneVerified}
                            label="Phone"
                          />
                        </span>
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "pill",
                          SUB_TONES[sub.status] ?? "bg-ink-100 text-ink-600"
                        )}
                      >
                        {sub.status === "TRIAL" &&
                          `Trial · ${sub.trialDaysLeft} day${
                            sub.trialDaysLeft === 1 ? "" : "s"
                          } left`}
                        {sub.status === "ACTIVE" &&
                          `Active until ${formatDate(sub.paidUntil)}`}
                        {sub.status === "EXPIRED" && "Expired"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-ink-500">
                      {formatDate(u.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
