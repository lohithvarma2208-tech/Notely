import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BadgeCheck, IndianRupee, Search } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import AuthAside from "@/components/auth/AuthAside";
import RegisterForm from "@/components/auth/RegisterForm";
import PhoneOtpForm from "@/components/auth/PhoneOtpForm";
import GoogleButton from "@/components/auth/GoogleButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Join Notely — hire trusted note writers, or earn money with your neat handwriting.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  const initialIntent = searchParams.role === "writer" ? "writer" : "student";

  return (
    <div className="container-x grid gap-10 py-12 lg:grid-cols-[1fr_1.1fr] lg:py-16">
      <AuthAside
        heading={
          <>
            Neat notes,
            <br />
            <span className="italic text-accent-300">zero all-nighters.</span>
          </>
        }
        subheading="Join thousands of students who post note requests — and the writers whose handwriting pays their bills."
        bullets={[
          {
            icon: <Search size={18} />,
            title: "Compare writers & samples",
            body: "See real handwriting samples, ratings and on-time records before you pick.",
          },
          {
            icon: <IndianRupee size={18} />,
            title: "Fair, transparent pricing",
            body: "Writers bid on your request — you always know the full price upfront.",
          },
          {
            icon: <BadgeCheck size={18} />,
            title: "Earned trust badges",
            body: "Identity Verified, Top Rated, 1,000+ Pages — every badge comes from real orders.",
          },
        ]}
        quote="Missed two weeks of classes after a fever. My writer rebuilt everything from photos — I revised the night before and passed comfortably."
        quoteAuthor="Sneha · Student, Hyderabad"
      />

      <div className="mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
            Create your account
          </h1>
          <p className="mt-2 text-ink-500">
            Free to join. Takes less than a minute.
          </p>
        </div>
        <div className="card p-6 sm:p-8">
          <GoogleButton />
          <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-ink-300">
            <span className="h-px flex-1 bg-ink-100" />
            or with email
            <span className="h-px flex-1 bg-ink-100" />
          </div>
          <RegisterForm initialIntent={initialIntent} />
          <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-ink-300">
            <span className="h-px flex-1 bg-ink-100" />
            or sign up with phone
            <span className="h-px flex-1 bg-ink-100" />
          </div>
          <PhoneOtpForm next="/dashboard" />
        </div>
      </div>
    </div>
  );
}
