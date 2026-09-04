import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import RequestWizard from "./RequestWizard";

export const metadata: Metadata = {
  title: "Post a note request",
};

export const dynamic = "force-dynamic";

export default async function NewRequestPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/requests/new");

  return (
    <div className="border-t border-ink-100 bg-cream/40">
      <div className="container-x py-10 sm:py-14">
        <div className="mb-10 max-w-2xl">
          <p className="pill mb-4 bg-accent-50 text-accent-700">
            New note request
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl">
            Tell us what notes{" "}
            <span className="italic text-accent-700">you need.</span>
          </h1>
          <p className="mt-3 text-ink-500">
            Six quick steps. Writers will send you offers with price and
            delivery time — you pick the one you like.
          </p>
        </div>
        <RequestWizard />
      </div>
    </div>
  );
}
