import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin login",
  description: "Log in to the Notely admin panel.",
};

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <div className="admin-bg -my-px flex min-h-[calc(100vh-72px)] items-center justify-center py-16">
      <div className="w-full max-w-md px-4">
        <div className="mb-10 text-center">
          <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-600 text-white shadow-lift">
            <ShieldCheck size={24} />
          </span>
          <h1 className="font-admin text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
            Notely Admin
          </h1>
          <p className="mt-3 text-[15px] text-ink-500">
            Log in with your admin credentials to manage the marketplace.
          </p>
        </div>
        <div className="card p-6 shadow-lift backdrop-blur-sm sm:p-8">
          <AdminLoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-ink-400">
          Restricted area — authorized administrators only.
        </p>
      </div>
    </div>
  );
}
