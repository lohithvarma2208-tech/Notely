import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/orders", label: "Orders" },
];

/**
 * Guards every page inside the (panel) route group — /admin/login lives
 * outside the group precisely so it never hits this check.
 */
export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <div className="admin-bg min-h-[calc(100vh-72px)]">
      <div className="container-x py-8 sm:py-10">
        <div className="card mb-8 flex flex-wrap items-center justify-between gap-3 px-4 py-3 shadow-lift backdrop-blur-sm sm:px-5">
          <Link
            href="/admin"
            className="flex items-center gap-2 font-admin text-lg font-bold tracking-tight text-ink-900"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-600 text-white">
              <ShieldCheck size={16} />
            </span>
            Notely Admin
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex items-center gap-1 text-sm font-medium">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-1.5 text-ink-600 transition-colors hover:bg-ink-100/70 hover:text-ink-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <AdminLogoutButton />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
