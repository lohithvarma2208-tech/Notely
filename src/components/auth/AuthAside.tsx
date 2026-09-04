import Link from "next/link";
import Image from "next/image";
import { PenLine } from "lucide-react";

type Bullet = { icon: React.ReactNode; title: string; body: string };

/**
 * Brand panel shown beside the login/register forms on large screens.
 * Presentational only — safe to render from server components.
 */
export default function AuthAside({
  heading,
  subheading,
  bullets,
  quote,
  quoteAuthor,
}: {
  heading: React.ReactNode;
  subheading: string;
  bullets: Bullet[];
  quote: string;
  quoteAuthor: string;
}) {
  return (
    <aside className="relative hidden overflow-hidden rounded-3xl border border-ink-100 bg-ink-950 p-10 text-paper lg:block">
      <Image
        src="/bg-car.jpg"
        alt=""
        fill
        className="object-cover object-center"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0a0a12]/80 via-[#0a0a12]/72 to-[#0a0a12]/88"
      />
      <div className="relative flex h-full flex-col">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-paper text-ink-900">
            <PenLine size={16} strokeWidth={2.2} />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Notely
          </span>
        </Link>

        <div className="mt-12">
          <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight">
            {heading}
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-ink-300">{subheading}</p>
        </div>

        <ul className="mt-10 space-y-5">
          {bullets.map((b) => (
            <li key={b.title} className="flex gap-4">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper/10 text-accent-300">
                {b.icon}
              </span>
              <div>
                <h3 className="font-semibold text-paper">{b.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-300">{b.body}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="ruled-paper ruled-margin mt-auto rotate-[-1.5deg] rounded-xl border border-ink-100 p-4 pl-11 pt-6 text-ink-800 shadow-lift">
          <p className="font-hand2 text-xl leading-[28px]">{quote}</p>
          <p className="mt-2 text-xs text-ink-400">{quoteAuthor}</p>
        </div>
      </div>
    </aside>
  );
}
