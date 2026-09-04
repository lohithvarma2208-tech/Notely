import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserWithProfile } from "@/lib/auth";
import Avatar from "@/components/Avatar";
import AccountForm, { LogoutButton } from "./AccountForm";
import {
  BadgeCheck,
  IndianRupee,
  PenLine,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account settings" };

export default async function SettingsPage() {
  const user = await getSessionUserWithProfile();
  if (!user) redirect("/login");

  const writer = user.writerProfile;

  return (
    <div className="container-x py-12 sm:py-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="section-title">Account settings</h1>
        <p className="mt-3 text-ink-500">
          Your details, your college, and — if you&apos;d like to earn — your
          note-writer profile.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        {/* ---------- Profile ---------- */}
        <section className="card p-6 sm:p-8">
          <div className="mb-8 flex items-center gap-4">
            <Avatar name={user.name} url={user.avatarUrl} size={56} />
            <div>
              <h2 className="font-display text-xl font-semibold text-ink-950">
                {user.name}
              </h2>
              <p className="text-sm text-ink-400">
                Member since {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          <div className="mb-5">
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              className="input cursor-not-allowed bg-ink-50/60 text-ink-400"
              value={user.email}
              disabled
              readOnly
            />
            <p className="mt-1.5 text-xs text-ink-400">
              Email can&apos;t be changed — it&apos;s how you sign in.
            </p>
          </div>

          <AccountForm
            initialName={user.name}
            initialPhone={user.phone ?? ""}
            initialCollege={user.college ?? ""}
          />
        </section>

        {/* ---------- Sidebar ---------- */}
        <aside className="space-y-6">
          {writer ? (
            <section className="card p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mint-50 text-mint-600">
                  <PenLine size={20} />
                </span>
                <span className="pill bg-mint-50 text-mint-700">Writer</span>
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold text-ink-950">
                {writer.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                Your note-writer profile is live. Keep your samples, pricing and
                availability fresh to win more orders.
              </p>
              <div className="mt-4 flex items-center gap-4 text-sm text-ink-500">
                <span className="flex items-center gap-1.5">
                  <BadgeCheck size={15} className="text-accent-600" />
                  {writer.jobsCompleted} jobs
                </span>
                <span className="flex items-center gap-1.5">
                  <IndianRupee size={15} className="text-accent-600" />
                  {writer.pricePerPage}/page
                </span>
              </div>
              <Link href="/settings/writer" className="btn-primary btn-md mt-5 w-full">
                Edit writer profile <ArrowRight size={15} />
              </Link>
            </section>
          ) : (
            <section className="relative overflow-hidden rounded-2xl bg-ink-950 p-6 text-paper shadow-lift">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(70% 60% at 85% 0%, rgba(51,143,252,0.25), transparent), radial-gradient(50% 50% at 0% 100%, rgba(16,185,129,0.18), transparent)",
                }}
              />
              <div className="relative">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-paper/10 text-accent-300">
                  <Sparkles size={20} />
                </span>
                <h2 className="mt-4 font-display text-2xl font-semibold leading-snug">
                  Neat handwriting?{" "}
                  <span className="italic text-accent-300">Make it pay.</span>
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-300">
                  Become a note writer and earn preparing, copying and
                  digitizing notes for fellow students.
                </p>
                <ul className="mt-5 space-y-2.5 text-sm text-ink-200">
                  <li className="flex items-center gap-2.5">
                    <IndianRupee size={15} className="shrink-0 text-accent-300" />
                    Set your own per-page rates
                  </li>
                  <li className="flex items-center gap-2.5">
                    <PenLine size={15} className="shrink-0 text-accent-300" />
                    Show off live handwriting samples
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck size={15} className="shrink-0 text-accent-300" />
                    Payment is funded before you start
                  </li>
                </ul>
                <Link href="/settings/writer" className="btn-accent btn-md mt-6 w-full">
                  Become a note writer <ArrowRight size={15} />
                </Link>
              </div>
            </section>
          )}

          <section className="card p-6">
            <h2 className="text-sm font-semibold text-ink-900">Session</h2>
            <p className="mb-4 mt-1 text-sm text-ink-500">
              Signed in as {user.email}
            </p>
            <LogoutButton />
          </section>
        </aside>
      </div>
    </div>
  );
}
