import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Camera, MessageSquare, ShieldCheck } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import AuthAside from "@/components/auth/AuthAside";
import LoginForm from "@/components/auth/LoginForm";
import PhoneOtpForm from "@/components/auth/PhoneOtpForm";
import GoogleButton from "@/components/auth/GoogleButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to Notely — the student note-writing marketplace.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; oauth?: string };
}) {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  // Only allow same-site paths as redirect targets.
  const next =
    typeof searchParams.next === "string" && searchParams.next.startsWith("/")
      ? searchParams.next
      : "/dashboard";

  return (
    <div className="container-x grid gap-10 py-12 lg:grid-cols-[1fr_1.1fr] lg:py-16">
      <AuthAside
        heading={
          <>
            Your notes are
            <br />
            <span className="italic text-accent-300">waiting for you.</span>
          </>
        }
        subheading="Pick up right where you left off — track your orders, chat with your note writer, or find your next request."
        bullets={[
          {
            icon: <ShieldCheck size={18} />,
            title: "Payments stay protected",
            body: "Funds are only released to the writer after you approve the delivered notes.",
          },
          {
            icon: <Camera size={18} />,
            title: "Progress with photo proof",
            body: "Watch your pages fill up with photo updates as the writer works.",
          },
          {
            icon: <MessageSquare size={18} />,
            title: "One private chat per order",
            body: "Clarify requirements and share files without leaving Notely.",
          },
        ]}
        quote="Finished module 3 today — 40 neat pages, headings and diagrams included."
        quoteAuthor="Ananya · Note Writer, Chennai"
      />

      <div className="mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2 text-ink-500">
            Log in to your Notely account to continue.
          </p>
        </div>
        <div className="card p-6 sm:p-8">
          <GoogleButton />
          {searchParams.oauth && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              Google sign-in didn&apos;t complete — please try again or use
              email / phone.
            </p>
          )}
          <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-ink-300">
            <span className="h-px flex-1 bg-ink-100" />
            or with email
            <span className="h-px flex-1 bg-ink-100" />
          </div>
          <LoginForm next={next} />
          <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-ink-300">
            <span className="h-px flex-1 bg-ink-100" />
            or continue with phone
            <span className="h-px flex-1 bg-ink-100" />
          </div>
          <PhoneOtpForm next={next} />
        </div>
      </div>
    </div>
  );
}
