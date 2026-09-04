import Link from "next/link";
import { notFound } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { db } from "@/lib/db";
import { getSessionUserWithProfile } from "@/lib/auth";
import { getConfigNumber } from "@/lib/config";
import {
  DELIVERY_METHODS,
  NOTEBOOK_SIZES,
  NOTE_TYPES,
  PEN_COLORS,
  WRITING_STYLES,
} from "@/lib/constants";
import { cn, daysUntil, formatDate, inr, timeAgo } from "@/lib/utils";
import Avatar from "@/components/Avatar";
import OfferForm from "./OfferForm";
import OffersList from "./OffersList";
import MyOfferCard from "./MyOfferCard";
import OwnerControls from "./OwnerControls";
import {
  ArrowRight,
  Calendar,
  FileArchive,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  NotebookPen,
  Package,
  Paperclip,
  PenLine,
  Presentation,
  Truck,
  Wallet,
} from "lucide-react";

export const dynamic = "force-dynamic";

const REQUEST_STATUS: Record<string, { label: string; cls: string }> = {
  OPEN: { label: "Open for offers", cls: "bg-mint-50 text-mint-700" },
  IN_ORDER: { label: "Order placed", cls: "bg-accent-50 text-accent-700" },
  CLOSED: { label: "Closed", cls: "bg-ink-100 text-ink-600" },
  CANCELLED: { label: "Cancelled", cls: "bg-red-50 text-red-600" },
};

const FILE_ICONS: Record<string, LucideIcon> = {
  PDF: FileText,
  IMAGE: ImageIcon,
  DOCX: FileText,
  PPTX: Presentation,
  OTHER: FileArchive,
};

const DELIVERY_SHORT: Record<string, string> = {
  DIGITAL: "Digital delivery",
  PHYSICAL: "Physical delivery",
};

function label<T extends string>(list: readonly { value: T; label: string }[], v: string) {
  return list.find((x) => x.value === v)?.label ?? v;
}

function fileSize(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

export default async function RequestPage({ params }: { params: { id: string } }) {
  const request = await db.noteRequest.findUnique({
    where: { id: params.id },
    include: {
      sources: { orderBy: { id: "asc" } },
      student: true,
      order: true,
      offers: {
        include: { writer: { include: { writerProfile: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!request) notFound();

  const viewer = await getSessionUserWithProfile();
  const isOwner = viewer?.id === request.studentId;
  const isWriter = Boolean(viewer?.writerProfile);
  const isOpen = request.status === "OPEN";
  const myOffer = viewer
    ? (request.offers.find((o) => o.writerId === viewer.id) ?? null)
    : null;
  const myPendingOffer = myOffer?.status === "PENDING" ? myOffer : null;

  const [minOffer, maxOffer] = await Promise.all([
    getConfigNumber("minOfferRupees"),
    getConfigNumber("maxOfferRupees"),
  ]);

  const statusMeta = REQUEST_STATUS[request.status] ?? {
    label: request.status,
    cls: "bg-ink-100 text-ink-600",
  };
  const left = Math.ceil((request.deadline.getTime() - Date.now()) / 86400000);
  const deadlineTone =
    left < 0 || left <= 1 ? "text-red-600" : left <= 3 ? "text-amber-600" : "text-ink-900";

  const notebookRows: Array<[string, string]> = [];
  if (request.notebookSize)
    notebookRows.push(["Notebook size", label(NOTEBOOK_SIZES, request.notebookSize)]);
  if (request.ruled)
    notebookRows.push(["Paper", request.ruled === "RULED" ? "Ruled" : "Unruled"]);
  if (request.sides)
    notebookRows.push([
      "Sides",
      request.sides === "SINGLE" ? "Single side" : "Both sides",
    ]);
  if (request.penColor)
    notebookRows.push(["Pen colour", label(PEN_COLORS, request.penColor)]);
  if (request.margins) notebookRows.push(["Margins", "Yes — leave margins on every page"]);
  if (request.headingStyle) notebookRows.push(["Heading style", request.headingStyle]);
  if (request.diagramReqs) notebookRows.push(["Diagrams", request.diagramReqs]);

  return (
    <div>
      {/* ---------- Header ---------- */}
      <section className="border-b border-ink-100 bg-cream/40">
        <div className="container-x py-10 sm:py-12">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="pill bg-accent-50 text-accent-700">{request.subject}</span>
            <span className="pill bg-paper text-ink-600 ring-1 ring-ink-100">
              {label(NOTE_TYPES, request.noteType)}
            </span>
            <span className={cn("pill", statusMeta.cls)}>{statusMeta.label}</span>
          </div>
          <h1 className="max-w-3xl font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
            {request.title}
          </h1>
          <p className="mt-3 text-sm text-ink-500">
            Posted {timeAgo(request.createdAt)} ·{" "}
            {request.offerCount === 0
              ? "no offers yet"
              : `${request.offerCount} offer${request.offerCount === 1 ? "" : "s"} so far`}
          </p>
        </div>
      </section>

      <section className="container-x py-10">
        {/* ---------- Budget / deadline band ---------- */}
        <div className="card mb-8 grid grid-cols-2 divide-ink-100 sm:grid-cols-4 sm:divide-x">
          <div className="p-5">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
              <Wallet size={13} /> Budget
            </p>
            <p className="mt-1.5 text-lg font-bold text-ink-950">
              {inr(request.budgetMin)}–{inr(request.budgetMax)}
            </p>
          </div>
          <div className="p-5">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
              <Calendar size={13} /> Deadline
            </p>
            <p className={cn("mt-1.5 text-lg font-bold", deadlineTone)}>
              {formatDate(request.deadline)}
            </p>
            <p className={cn("text-xs", deadlineTone)}>{daysUntil(request.deadline)}</p>
          </div>
          <div className="p-5">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
              <FileText size={13} /> Pages
            </p>
            <p className="mt-1.5 text-lg font-bold text-ink-950">
              {request.pagesUnknown || !request.estPages
                ? "To be decided"
                : `~${request.estPages}`}
            </p>
          </div>
          <div className="p-5">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
              <Truck size={13} /> Delivery
            </p>
            <p className="mt-1.5 text-lg font-bold text-ink-950">
              {DELIVERY_SHORT[request.deliveryMethod] ??
                label(DELIVERY_METHODS, request.deliveryMethod)}
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* ---------- Left column ---------- */}
          <div className="flex min-w-0 flex-col gap-6">
            {/* Brief */}
            <div className="card p-6">
              <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold text-ink-950">
                <NotebookPen size={18} className="text-accent-600" /> Brief &amp;
                instructions
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">
                {request.instructions || "No additional instructions provided."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-4">
                <span className="pill bg-ink-50 text-ink-600">
                  Writing style: {label(WRITING_STYLES, request.writingStyle)}
                </span>
              </div>
            </div>

            {/* Notebook requirements */}
            {notebookRows.length > 0 && (
              <div className="card p-6">
                <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-ink-950">
                  <PenLine size={18} className="text-accent-600" /> Notebook requirements
                </h2>
                <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {notebookRows.map(([k, v]) => (
                    <div key={k} className="flex flex-col">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                        {k}
                      </dt>
                      <dd className="mt-0.5 text-sm text-ink-800">{v}</dd>
                    </div>
                  ))}
                </dl>
                {request.deliveryNotes && (
                  <p className="mt-4 rounded-xl bg-cream/70 px-4 py-3 text-sm text-ink-600">
                    <span className="font-semibold text-ink-800">Delivery note: </span>
                    {request.deliveryNotes}
                  </p>
                )}
              </div>
            )}

            {/* Source files */}
            <div className="card p-6">
              <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-ink-950">
                <Paperclip size={18} className="text-accent-600" /> Source material
              </h2>
              {request.sources.length === 0 ? (
                <p className="text-sm text-ink-400">
                  No files attached — the student will share material after the order
                  starts.
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2.5">
                  {request.sources.map((f) => {
                    const Icon = FILE_ICONS[f.fileType] ?? FileArchive;
                    const chip = (
                      <>
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                          <Icon size={15} />
                        </span>
                        <span className="min-w-0">
                          <span className="block max-w-52 truncate text-sm font-medium text-ink-900">
                            {f.fileName}
                          </span>
                          <span className="block text-xs text-ink-400">
                            {f.fileType} · {fileSize(f.sizeKb)}
                          </span>
                        </span>
                      </>
                    );
                    return (
                      <li key={f.id}>
                        {f.url && f.url !== "#" ? (
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2.5 rounded-xl border border-ink-100 bg-paper px-3 py-2 transition-colors hover:border-accent-300"
                          >
                            {chip}
                          </a>
                        ) : (
                          <span className="flex items-center gap-2.5 rounded-xl border border-ink-100 bg-paper px-3 py-2">
                            {chip}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Owner: offers */}
            {isOwner && (
              <div>
                <div className="mb-4">
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-950">
                    Offers from note writers
                  </h2>
                  <p className="mt-1 text-sm text-ink-500">
                    Compare prices, ratings and delivery estimates. Your payment is held
                    by Notely until you approve the finished notes.
                  </p>
                </div>
                <OffersList
                  offers={request.offers}
                  estPages={request.estPages}
                  canAccept={isOpen && !request.order}
                />
              </div>
            )}
          </div>

          {/* ---------- Sidebar ---------- */}
          <aside className="flex flex-col gap-6">
            {/* Student card */}
            <div className="card p-5">
              <p className="label">Posted by</p>
              <div className="flex items-center gap-3.5">
                <Avatar
                  name={request.student.name}
                  url={request.student.avatarUrl}
                  size={48}
                />
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-semibold text-ink-950">
                    {request.student.name}
                  </p>
                  {request.student.college && (
                    <p className="flex items-center gap-1.5 truncate text-sm text-ink-500">
                      <GraduationCap size={14} className="shrink-0 text-ink-400" />
                      {request.student.college}
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-3 border-t border-ink-100 pt-3 text-xs text-ink-400">
                Student on Notely since {formatDate(request.student.createdAt)}
              </p>
            </div>

            {/* Action card */}
            {isOwner ? (
              <div className="card flex flex-col gap-4 p-5">
                {request.order ? (
                  <>
                    <p className="flex items-start gap-2 text-sm text-ink-600">
                      <Package size={16} className="mt-0.5 shrink-0 text-mint-600" />
                      This request has been placed as an order. Track progress, chat
                      with the writer and review the delivered notes from the order
                      page.
                    </p>
                    <Link href={`/orders/${request.order.id}`} className="btn-primary btn-md w-full">
                      Go to order <ArrowRight size={15} />
                    </Link>
                  </>
                ) : isOpen ? (
                  <>
                    <h3 className="font-display text-lg font-semibold text-ink-950">
                      Manage this request
                    </h3>
                    <OwnerControls
                      requestId={request.id}
                      budgetMin={request.budgetMin}
                      budgetMax={request.budgetMax}
                      deadline={request.deadline.toISOString()}
                      instructions={request.instructions}
                    />
                  </>
                ) : (
                  <p className="text-sm text-ink-500">
                    This request is {statusMeta.label.toLowerCase()} and is no longer
                    receiving offers.
                  </p>
                )}
              </div>
            ) : isWriter ? (
              <div className="card flex flex-col gap-4 p-5">
                {isOpen ? (
                  myPendingOffer ? (
                    <>
                      <h3 className="font-display text-lg font-semibold text-ink-950">
                        Your offer
                      </h3>
                      <MyOfferCard
                        offerId={myPendingOffer.id}
                        status={myPendingOffer.status}
                        priceType={myPendingOffer.priceType}
                        totalPrice={myPendingOffer.totalPrice}
                        pricePerPage={myPendingOffer.pricePerPage}
                        estPages={request.estPages}
                        estimatedDays={myPendingOffer.estimatedDays}
                        message={myPendingOffer.message}
                        createdAt={myPendingOffer.createdAt.toISOString()}
                      />
                    </>
                  ) : (
                    <>
                      <h3 className="font-display text-lg font-semibold text-ink-950">
                        Make an offer
                      </h3>
                      {myOffer && (
                        <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-3.5">
                          <MyOfferCard
                            offerId={myOffer.id}
                            status={myOffer.status}
                            priceType={myOffer.priceType}
                            totalPrice={myOffer.totalPrice}
                            pricePerPage={myOffer.pricePerPage}
                            estPages={request.estPages}
                            estimatedDays={myOffer.estimatedDays}
                            message={myOffer.message}
                            createdAt={myOffer.createdAt.toISOString()}
                          />
                        </div>
                      )}
                      <OfferForm
                        requestId={request.id}
                        estPages={request.estPages}
                        pagesUnknown={request.pagesUnknown}
                        budgetMin={request.budgetMin}
                        budgetMax={request.budgetMax}
                        minOffer={minOffer}
                        maxOffer={maxOffer}
                      />
                    </>
                  )
                ) : myOffer ? (
                  <>
                    <h3 className="font-display text-lg font-semibold text-ink-950">
                      Your offer
                    </h3>
                    <MyOfferCard
                      offerId={myOffer.id}
                      status={myOffer.status}
                      priceType={myOffer.priceType}
                      totalPrice={myOffer.totalPrice}
                      pricePerPage={myOffer.pricePerPage}
                      estPages={request.estPages}
                      estimatedDays={myOffer.estimatedDays}
                      message={myOffer.message}
                      createdAt={myOffer.createdAt.toISOString()}
                    />
                  </>
                ) : (
                  <p className="text-sm text-ink-500">
                    This request is {statusMeta.label.toLowerCase()} and is no longer
                    accepting offers.
                  </p>
                )}
              </div>
            ) : (
              <div className="card flex flex-col gap-3 bg-ink-950 p-5 text-paper">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-800 text-accent-300">
                  <PenLine size={18} />
                </span>
                <h3 className="font-display text-lg font-semibold">
                  Write notes. Earn money.
                </h3>
                <p className="text-sm leading-relaxed text-ink-300">
                  Sign up as a note writer to make an offer on this request — set your
                  own price and delivery time.
                </p>
                {viewer ? (
                  <Link href="/settings/writer" className="btn-accent btn-md mt-1 w-full">
                    Set up your writer profile <ArrowRight size={15} />
                  </Link>
                ) : (
                  <>
                    <Link href="/register?role=writer" className="btn-accent btn-md mt-1 w-full">
                      Become a note writer <ArrowRight size={15} />
                    </Link>
                    <Link
                      href="/login"
                      className="btn btn-md w-full border border-ink-700 text-paper hover:bg-ink-800"
                    >
                      Log in
                    </Link>
                  </>
                )}
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
