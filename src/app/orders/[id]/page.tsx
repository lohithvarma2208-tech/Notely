import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { NOTE_TYPES, DELIVERY_METHODS, DELIVERY_STATUSES } from "@/lib/constants";
import { daysUntil, formatDate, inr } from "@/lib/utils";
import Avatar from "@/components/Avatar";
import RatingStars from "@/components/RatingStars";
import StatusPill from "@/components/StatusPill";
import ProgressPanel from "@/components/order/ProgressPanel";
import ChatPanel from "@/components/order/ChatPanel";
import OrderActions from "@/components/order/OrderActions";
import ReviewForm from "@/components/order/ReviewForm";
import ReviewView from "@/components/order/ReviewView";
import { parseDeliveryFiles, type ProgressEntry } from "@/components/order/types";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  CreditCard,
  FileText,
  Receipt,
  Star,
  Truck,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const order = await db.order.findUnique({
    where: { id: params.id },
    include: { request: { select: { title: true } } },
  });
  return { title: order ? `Order — ${order.request.title}` : "Order" };
}

export default async function OrderRoomPage({ params }: Params) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const order = await db.order.findUnique({
    where: { id: params.id },
    include: {
      request: true,
      student: true,
      writer: { include: { writerProfile: true } },
      progress: { orderBy: { createdAt: "desc" } },
      review: { include: { student: true } },
    },
  });
  // Only the two participants may ever see the order room.
  if (!order || (order.studentId !== user.id && order.writerId !== user.id)) {
    notFound();
  }

  const isStudent = order.studentId === user.id;
  const role = isStudent ? ("STUDENT" as const) : ("WRITER" as const);
  const other = isStudent ? order.writer : order.student;
  const writerProfile = order.writer.writerProfile;

  const deliveryFiles = parseDeliveryFiles(order.deliveryFiles);
  const updates: ProgressEntry[] = order.progress.map((p) => ({
    id: p.id,
    pagesCompleted: p.pagesCompleted,
    note: p.note,
    photoUrl: p.photoUrl,
    createdAt: p.createdAt.toISOString(),
  }));

  const noteTypeLabel =
    NOTE_TYPES.find((t) => t.value === order.request.noteType)?.label ??
    order.request.noteType;
  const deliveryMethodLabel =
    DELIVERY_METHODS.find((d) => d.value === order.deliveryMethod)?.label ??
    order.deliveryMethod;
  const deliveryStatusLabel = order.deliveryStatus
    ? DELIVERY_STATUSES.find((s) => s.value === order.deliveryStatus)?.label ??
      order.deliveryStatus
    : null;
  const feePctLabel = String(order.platformFeePct).replace(/\.0+$/, "");
  const overdue =
    new Date(order.deadline).getTime() < Date.now() &&
    !["COMPLETED", "CANCELLED", "REFUNDED"].includes(order.status);

  const otherPartyCard = (
    <div className="flex items-center gap-3">
      <Avatar name={other.name} url={other.avatarUrl} size={44} />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          {isStudent ? "Your note writer" : "Your student"}
        </p>
        <p className="truncate font-semibold text-ink-900">{other.name}</p>
        {isStudent && writerProfile ? (
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500">
            <RatingStars value={writerProfile.ratingAvg} size={11} />
            <span className="font-medium text-ink-700">
              {writerProfile.ratingAvg.toFixed(1)}
            </span>
            <span className="text-ink-400">({writerProfile.ratingCount})</span>
          </span>
        ) : (
          <span className="text-xs text-ink-400">{other.college ?? "Student"}</span>
        )}
      </div>
      {isStudent && <ChevronRight size={16} className="ml-1 shrink-0 text-ink-300" />}
    </div>
  );

  return (
    <div>
      {/* ---------- Header ---------- */}
      <header className="border-b border-ink-100 bg-cream/50">
        <div className="container-x py-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900"
          >
            <ArrowLeft size={15} /> Back to dashboard
          </Link>
          <div className="mt-5 flex flex-wrap items-start justify-between gap-x-10 gap-y-6">
            <div className="min-w-0 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={order.status} />
                <span className="pill bg-accent-50 text-accent-700">
                  {order.request.subject}
                </span>
                <span className="pill bg-ink-100 text-ink-600">{noteTypeLabel}</span>
              </div>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
                {order.request.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-ink-500">
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={14} className="text-ink-400" />
                  Due {formatDate(order.deadline)}
                  <span className={overdue ? "font-semibold text-red-600" : "text-ink-400"}>
                    · {daysUntil(order.deadline)}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText size={14} className="text-ink-400" />
                  {order.totalPages} pages
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 sm:flex-nowrap">
              <div className="sm:text-right">
                <p className="text-3xl font-bold tracking-tight text-ink-950">
                  {inr(order.agreedPrice)}
                </p>
                <p className="mt-0.5 text-xs text-ink-400">
                  {order.pricePerPage
                    ? `${order.totalPages} pages × ${inr(order.pricePerPage)}/page`
                    : "Flat price"}
                </p>
              </div>
              {isStudent ? (
                <Link
                  href={`/writers/${order.writerId}`}
                  className="card flex items-center px-4 py-3 transition-shadow hover:shadow-lift"
                >
                  {otherPartyCard}
                </Link>
              ) : (
                <div className="card px-4 py-3">{otherPartyCard}</div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ---------- Body ---------- */}
      <div className="container-x py-8">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6">
            <ProgressPanel
              orderId={order.id}
              status={order.status}
              isWriter={!isStudent}
              totalPages={order.totalPages}
              pagesCompleted={order.pagesCompleted}
              updates={updates}
            />
            <ChatPanel
              orderId={order.id}
              viewerId={user.id}
              otherPartyName={other.name}
            />
          </div>

          <aside className="min-w-0 space-y-6">
            <OrderActions
              orderId={order.id}
              status={order.status}
              role={role}
              agreedPrice={order.agreedPrice}
              totalPages={order.totalPages}
              pricePerPage={order.pricePerPage}
              pagesCompleted={order.pagesCompleted}
              deliveryMethod={order.deliveryMethod}
              deliveryFiles={deliveryFiles}
              writerEarning={order.writerEarning}
              platformFeePct={order.platformFeePct}
            />

            {order.review ? (
              <ReviewView
                review={{
                  overall: order.review.overall,
                  handwriting: order.review.handwriting,
                  accuracy: order.review.accuracy,
                  neatness: order.review.neatness,
                  communication: order.review.communication,
                  onTime: order.review.onTime,
                  text: order.review.text,
                  createdAt: order.review.createdAt,
                  studentName: order.review.student.name,
                  studentAvatarUrl: order.review.student.avatarUrl,
                }}
              />
            ) : order.status === "COMPLETED" && isStudent ? (
              <ReviewForm orderId={order.id} />
            ) : order.status === "COMPLETED" ? (
              <section className="card p-6">
                <h2 className="font-display text-lg font-semibold text-ink-950">Review</h2>
                <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-ink-500">
                  <Star size={15} className="mt-0.5 shrink-0 text-ink-300" />
                  The student hasn&apos;t reviewed this order yet. Reviews appear here
                  once submitted.
                </p>
              </section>
            ) : null}

            {/* ---------- Order meta ---------- */}
            <section className="card p-6">
              <h2 className="label">Order details</h2>
              <ul className="space-y-4">
                <MetaRow icon={CreditCard} label="Payment">
                  {order.paymentMode ? (
                    <>
                      <p className="font-medium text-ink-800">
                        {order.paymentMode === "MOCK"
                          ? "Mock payment (dev mode)"
                          : "Razorpay"}
                        {order.paidAt && (
                          <span className="font-normal text-ink-400">
                            {" "}
                            · paid {formatDate(order.paidAt)}
                          </span>
                        )}
                      </p>
                      {order.paymentId && (
                        <p
                          className="mt-0.5 truncate text-xs text-ink-400"
                          title={order.paymentId}
                        >
                          <code>{order.paymentId}</code>
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-ink-500">Not paid yet</p>
                  )}
                </MetaRow>
                <MetaRow icon={Receipt} label="Fee split">
                  <p className="text-ink-500">
                    Notely fee {feePctLabel}% included — writer receives{" "}
                    <span className="font-medium text-ink-800">
                      {inr(order.writerEarning)}
                    </span>
                  </p>
                </MetaRow>
                <MetaRow icon={Truck} label="Delivery">
                  <p className="font-medium text-ink-800">{deliveryMethodLabel}</p>
                  {(deliveryStatusLabel || order.trackingRef) && (
                    <p className="mt-0.5 text-xs text-ink-400">
                      {deliveryStatusLabel}
                      {order.trackingRef ? ` · ${order.trackingRef}` : ""}
                    </p>
                  )}
                </MetaRow>
                <MetaRow icon={CalendarDays} label="Timeline">
                  <p className="text-ink-500">
                    Placed {formatDate(order.createdAt)}
                    {order.completedAt && (
                      <>
                        {" "}
                        · completed{" "}
                        <span className="font-medium text-ink-800">
                          {formatDate(order.completedAt)}
                        </span>
                      </>
                    )}
                  </p>
                </MetaRow>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CreditCard;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-400">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          {label}
        </p>
        <div className="mt-0.5">{children}</div>
      </div>
    </li>
  );
}
