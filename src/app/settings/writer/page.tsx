import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { splitList } from "@/lib/utils";
import WriterProfileForm, { type WriterProfileData } from "./WriterProfileForm";
import SamplesManager from "./SamplesManager";
import { PenLine } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Note-writer profile" };

export default async function WriterSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await db.writerProfile.findUnique({
    where: { userId: user.id },
    include: { samples: { orderBy: { sortOrder: "asc" } } },
  });

  const initial: WriterProfileData | null = profile
    ? {
        title: profile.title,
        bio: profile.bio,
        location: profile.location,
        languages: splitList(profile.languages),
        subjects: splitList(profile.subjects),
        handwritingStyles: splitList(profile.handwritingStyles),
        pricePerPage: profile.pricePerPage,
        digitalPricePerPage: profile.digitalPricePerPage,
        minOrderValue: profile.minOrderValue,
        availability: profile.availability,
        turnaroundDays: profile.turnaroundDays,
        acceptsDigital: profile.acceptsDigital,
        acceptsHandwritten: profile.acceptsHandwritten,
      }
    : null;

  return (
    <div className="container-x max-w-4xl py-12 sm:py-16">
      <header className="mb-10">
        <p className="pill mb-4 bg-accent-50 text-accent-700">
          <PenLine size={13} /> {profile ? "Note-writer studio" : "Earn on Notely"}
        </p>
        <h1 className="section-title">
          {profile ? (
            "Your note-writer profile"
          ) : (
            <>
              Become a <span className="italic text-accent-700">Note Writer</span>
            </>
          )}
        </h1>
        <p className="mt-3 max-w-2xl text-ink-500">
          {profile
            ? "This is your storefront. Students compare your rates, styles and handwriting samples before placing an order — keep them sharp."
            : "Set up your storefront once: your subjects, your rates, and a few handwriting samples. Then start earning for preparing, copying and digitizing notes — never exams or graded assessments."}
        </p>
      </header>

      <WriterProfileForm initial={initial} />

      {profile && (
        <section className="mt-12">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-semibold text-ink-950">
              Handwriting samples
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              The single biggest reason students pick one writer over another.
              Show range — headings, math, everyday writing.
            </p>
          </div>
          <SamplesManager samples={profile.samples} />
        </section>
      )}
    </div>
  );
}
