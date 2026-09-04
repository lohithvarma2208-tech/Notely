import Link from "next/link";
import { getSessionUserWithProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import ProfileMenu from "./ProfileMenu";
import ThemeToggle from "./ThemeToggle";
import MobileMenu from "./MobileMenu";
import ModulesMenu from "./ModulesMenu";
import Logo from "./Logo";

export default async function Navbar() {
  const user = await getSessionUserWithProfile();
  const unread = user
    ? await db.notification.count({ where: { userId: user.id, readAt: null } })
    : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-paper/90 backdrop-blur-md">
      <div className="container-x flex h-[72px] items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Notely home">
            <Logo size={36} />
          </Link>
          <ModulesMenu loggedIn={Boolean(user)} />
        </div>

        <nav className="hidden items-center gap-1 text-[15px] font-medium text-ink-600 md:flex">
          <Link className="rounded-lg px-3.5 py-2 hover:bg-ink-50 hover:text-ink-900" href="/writers">
            Note Writers
          </Link>
          <Link className="rounded-lg px-3.5 py-2 hover:bg-ink-50 hover:text-ink-900" href="/find-work">
            Find Work
          </Link>
          <Link className="rounded-lg px-3.5 py-2 hover:bg-ink-50 hover:text-ink-900" href="/#how-it-works">
            How It Works
          </Link>
          <Link className="rounded-lg px-3.5 py-2 hover:bg-ink-50 hover:text-ink-900" href="/#pricing">
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="relative rounded-lg px-3.5 py-2 text-[15px] font-medium text-ink-600 hover:bg-ink-50 hover:text-ink-900"
              >
                Dashboard
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-600 px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <ProfileMenu
                name={user.name}
                email={user.email}
                phone={user.phone}
              />
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost btn-md hidden sm:inline-flex">
                Log in
              </Link>
              <Link href="/register" className="btn-primary btn-md hidden sm:inline-flex">
                Sign up free
              </Link>
            </>
          )}
          <MobileMenu loggedIn={Boolean(user)} />
        </div>
      </div>
    </header>
  );
}
