import Link from "next/link";
import Logo from "./Logo";

const COLUMNS: Array<{ heading: string; links: Array<{ label: string; href: string }> }> = [
  {
    heading: "For Students",
    links: [
      { label: "Post a note request", href: "/requests/new" },
      { label: "Browse note writers", href: "/writers" },
      { label: "Track your orders", href: "/dashboard" },
      { label: "How it works", href: "/#how-it-works" },
    ],
  },
  {
    heading: "For Note Writers",
    links: [
      { label: "Find work", href: "/find-work" },
      { label: "Build your profile", href: "/settings/writer" },
      { label: "Earnings", href: "/earnings" },
      { label: "Become a writer", href: "/register?role=writer" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Pricing", href: "/#pricing" },
      { label: "Reviews", href: "/#reviews" },
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/register" },
    ],
  },
];

/** Footer is intentionally dark in BOTH themes. */
export default function Footer() {
  return (
    <footer className="bg-[#06060b] text-[#b9b9c9]">
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <Logo size={36} wordmarkClassName="text-white" />
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-[#8a8a9e]">
            Your notes. Done neatly. The marketplace connecting students with
            trusted note writers for note preparation, copying, organizing and
            digitization.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              {col.heading}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-[#8a8a9e] transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-[#1c1c28] py-6">
        <p className="container-x text-xs leading-relaxed text-[#6b6b80]">
          © {new Date().getFullYear()} Notely. Notely is a marketplace for note
          writing, note preparation, organization and digitization of study
          material — not a service for completing graded examinations or
          assessments on a student&apos;s behalf.
        </p>
      </div>
    </footer>
  );
}
