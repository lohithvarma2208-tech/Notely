"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  NOTE_TYPES,
  WRITING_STYLES,
  NOTEBOOK_SIZES,
  PEN_COLORS,
  SUBJECTS,
} from "@/lib/constants";
import { cn, inr, formatDate } from "@/lib/utils";
import {
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Download,
  FileText,
  IndianRupee,
  LoaderCircle,
  NotebookPen,
  PenLine,
  Sparkles,
  Truck,
  X,
} from "lucide-react";

type UploadedFile = {
  fileName: string;
  fileType: string;
  url: string;
  sizeKb: number;
};

const PHYSICAL_NOTE_TYPES = [
  "HANDWRITTEN",
  "REWRITE",
  "PDF_TO_HANDWRITTEN",
  "NOTEBOOK_COMPLETION",
];

const NOTE_TYPE_BLURBS: Record<string, string> = {
  HANDWRITTEN: "Fresh notes written by hand from your source material.",
  DIGITAL: "Typed, well-formatted notes delivered as PDF or DOCX.",
  REWRITE: "Your existing notes, rewritten neater and better organized.",
  PHOTO_TO_CLEAN: "Turn messy notebook photos into one clean set.",
  PDF_TO_HANDWRITTEN: "Faculty PDFs rewritten by hand — exam-ready.",
  NOTEBOOK_COMPLETION: "Get an incomplete class notebook finished and organized.",
};

const STYLE_BLURBS: Record<string, string> = {
  NORMAL: "Readable everyday handwriting.",
  NEAT: "Tidy and consistent, easy to revise from.",
  VERY_NEAT: "Slow, careful writing — the pretty kind.",
  EXAM_REVISION: "Short points, keywords and memory hooks.",
  DETAILED: "Full explanations with examples.",
  COMPACT: "Maximum content per page.",
  CUSTOM: "Describe exactly what you want.",
};

const STEPS = [
  { n: 1, label: "Subject & title" },
  { n: 2, label: "Note type" },
  { n: 3, label: "Source material" },
  { n: 4, label: "Pages" },
  { n: 5, label: "Writing style" },
  { n: 6, label: "Budget & deadline" },
];

const ACCEPT =
  ".pdf,.png,.jpg,.jpeg,.webp,.gif,.heic,.doc,.docx,.ppt,.pptx,.zip";

export default function RequestWizard() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [triedNext, setTriedNext] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [title, setTitle] = useState("");
  // Step 2
  const [noteType, setNoteType] = useState("");
  // Step 3
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadingNames, setUploadingNames] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [instructions, setInstructions] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  // Step 4
  const [estPages, setEstPages] = useState("");
  const [pagesUnknown, setPagesUnknown] = useState(false);
  // Step 5
  const [writingStyle, setWritingStyle] = useState("");
  const [customStyleText, setCustomStyleText] = useState("");
  const [notebookSize, setNotebookSize] = useState("");
  const [ruled, setRuled] = useState("");
  const [sides, setSides] = useState("");
  const [penColor, setPenColor] = useState("");
  const [margins, setMargins] = useState(false);
  const [headingStyle, setHeadingStyle] = useState("");
  const [diagramReqs, setDiagramReqs] = useState("");
  // Step 6
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [deadline, setDeadline] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"DIGITAL" | "PHYSICAL">(
    "DIGITAL"
  );
  const [deliveryNotes, setDeliveryNotes] = useState("");

  const finalSubject =
    subject === "__CUSTOM__" ? customSubject.trim() : subject;
  const isPhysical = PHYSICAL_NOTE_TYPES.includes(noteType);
  const pages = parseInt(estPages, 10);
  const minB = parseInt(budgetMin, 10);
  const maxB = parseInt(budgetMax, 10);

  const tomorrow = useMemo(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  }, []);

  const stepValid = (s: number): boolean => {
    switch (s) {
      case 0:
        return finalSubject.length >= 2 && title.trim().length >= 6;
      case 1:
        return noteType !== "";
      case 2:
        return uploadingNames.length === 0;
      case 3:
        return pagesUnknown || (Number.isInteger(pages) && pages >= 1);
      case 4:
        return (
          writingStyle !== "" &&
          (writingStyle !== "CUSTOM" || customStyleText.trim().length >= 3)
        );
      case 5:
        return (
          Number.isInteger(minB) &&
          minB >= 50 &&
          Number.isInteger(maxB) &&
          maxB >= minB &&
          deadline !== "" &&
          deadline >= tomorrow &&
          (deliveryMethod === "DIGITAL" || deliveryNotes.trim().length >= 5)
        );
      default:
        return false;
    }
  };

  const goNext = () => {
    if (!stepValid(step)) {
      setTriedNext(true);
      return;
    }
    setTriedNext(false);
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setTriedNext(false);
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const jumpTo = (i: number) => {
    // allow jumping back to any earlier (completed) step
    if (i < step) {
      setTriedNext(false);
      setError("");
      setStep(i);
    }
  };

  async function handleFiles(list: FileList | null) {
    if (!list) return;
    setError("");
    for (const file of Array.from(list)) {
      if (file.size > 25 * 1024 * 1024) {
        setError(`"${file.name}" is over 25 MB — skipped`);
        continue;
      }
      setUploadingNames((u) => [...u, file.name]);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        setFiles((f) => [...f, data as UploadedFile]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploadingNames((u) => u.filter((n) => n !== file.name));
      }
    }
  }

  const removeFile = (url: string) =>
    setFiles((f) => f.filter((x) => x.url !== url));

  async function submit() {
    if (!stepValid(5)) {
      setTriedNext(true);
      return;
    }
    setSubmitting(true);
    setError("");
    const styleNote =
      writingStyle === "CUSTOM" && customStyleText.trim()
        ? `Custom style: ${customStyleText.trim()}`
        : "";
    const combinedInstructions = [instructions.trim(), styleNote]
      .filter(Boolean)
      .join("\n\n");

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subject: finalSubject,
          noteType,
          instructions: combinedInstructions,
          estPages: pagesUnknown ? null : pages,
          pagesUnknown,
          writingStyle,
          notebookSize: isPhysical && notebookSize ? notebookSize : null,
          ruled: isPhysical && ruled ? ruled : null,
          sides: isPhysical && sides ? sides : null,
          penColor: isPhysical && penColor ? penColor : null,
          margins: isPhysical ? margins : false,
          headingStyle: isPhysical && headingStyle.trim() ? headingStyle.trim() : null,
          diagramReqs: isPhysical && diagramReqs.trim() ? diagramReqs.trim() : null,
          deliveryMethod,
          deliveryNotes:
            deliveryMethod === "PHYSICAL" ? deliveryNotes.trim() : null,
          deadline,
          budgetMin: minB,
          budgetMax: maxB,
          files,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not post your request");
      router.push(`/requests/${data.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post your request");
      setSubmitting(false);
    }
  }

  const noteTypeLabel =
    NOTE_TYPES.find((t) => t.value === noteType)?.label ?? "";
  const writingStyleLabel =
    WRITING_STYLES.find((s) => s.value === writingStyle)?.label ?? "";

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      {/* ---------- Progress rail (desktop) ---------- */}
      <aside className="hidden lg:block">
        <ol className="sticky top-8 space-y-1">
          {STEPS.map((s, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={s.n}>
                <button
                  type="button"
                  onClick={() => jumpTo(i)}
                  disabled={!done}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    done && "cursor-pointer hover:bg-paper",
                    current && "bg-paper shadow-card",
                    !done && !current && "cursor-default opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                      done && "bg-mint-500 text-white",
                      current && "bg-accent-600 text-white",
                      !done && !current && "bg-ink-100 text-ink-500"
                    )}
                  >
                    {done ? <Check size={14} /> : s.n}
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      current
                        ? "font-semibold text-ink-950"
                        : done
                          ? "font-medium text-ink-700"
                          : "text-ink-500"
                    )}
                  >
                    {s.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      {/* ---------- Mobile progress ---------- */}
      <div className="lg:hidden">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-ink-900">
            Step {step + 1} of {STEPS.length} — {STEPS[step].label}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-600 transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* ---------- Step panel ---------- */}
      <div className="min-w-0">
        <div key={step} className="animate-rise">
          {step === 0 && (
            <section className="card p-6 sm:p-8">
              <h2 className="font-display text-2xl font-semibold text-ink-950">
                What subject are the notes for?
              </h2>
              <p className="mt-1.5 text-sm text-ink-500">
                Pick a subject, or type your own.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubject(s)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-[0.97]",
                      subject === s
                        ? "border-accent-600 bg-accent-50 text-accent-700"
                        : "border-ink-200 bg-paper text-ink-700 hover:border-ink-400"
                    )}
                  >
                    {s}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSubject("__CUSTOM__")}
                  className={cn(
                    "rounded-full border border-dashed px-4 py-2 text-sm font-medium transition-all active:scale-[0.97]",
                    subject === "__CUSTOM__"
                      ? "border-accent-600 bg-accent-50 text-accent-700"
                      : "border-ink-300 bg-paper text-ink-500 hover:border-ink-400"
                  )}
                >
                  + Custom subject
                </button>
              </div>
              {subject === "__CUSTOM__" && (
                <div className="mt-4">
                  <input
                    className="input max-w-sm"
                    placeholder="e.g. Thermodynamics, Organic Chemistry…"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    maxLength={60}
                    autoFocus
                  />
                </div>
              )}
              <div className="mt-8">
                <label className="label" htmlFor="rq-title">
                  Short title for your request
                </label>
                <input
                  id="rq-title"
                  className="input max-w-lg"
                  placeholder="e.g. Java Module 2 notes from faculty PDFs"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                />
                <p className="mt-1.5 text-xs text-ink-400">
                  This is the first thing writers see — make it specific.
                </p>
              </div>
              {triedNext && !stepValid(0) && (
                <p className="mt-4 text-sm font-medium text-red-600">
                  Pick a subject and give a title of at least 6 characters.
                </p>
              )}
            </section>
          )}

          {step === 1 && (
            <section className="card p-6 sm:p-8">
              <h2 className="font-display text-2xl font-semibold text-ink-950">
                What kind of notes do you need?
              </h2>
              <p className="mt-1.5 text-sm text-ink-500">
                Choose the one that fits best.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {NOTE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setNoteType(t.value)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-all active:scale-[0.99]",
                      noteType === t.value
                        ? "border-accent-600 bg-accent-50 ring-2 ring-accent-100"
                        : "border-ink-200 bg-paper hover:border-ink-400"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-ink-950">
                        {t.label}
                      </span>
                      {noteType === t.value && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-600 text-white">
                          <Check size={12} />
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-ink-500">
                      {NOTE_TYPE_BLURBS[t.value]}
                    </p>
                  </button>
                ))}
              </div>
              {triedNext && !stepValid(1) && (
                <p className="mt-4 text-sm font-medium text-red-600">
                  Choose a note type to continue.
                </p>
              )}
            </section>
          )}

          {step === 2 && (
            <section className="card p-6 sm:p-8">
              <h2 className="font-display text-2xl font-semibold text-ink-950">
                Add your source material
              </h2>
              <p className="mt-1.5 text-sm text-ink-500">
                Faculty PDFs, notebook photos, slides — whatever the writer
                should work from. Optional, but it gets you better offers.
              </p>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInput.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    fileInput.current?.click();
                }}
                className={cn(
                  "mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                  dragOver
                    ? "border-accent-500 bg-accent-50"
                    : "border-ink-200 bg-ink-50/50 hover:border-ink-300 hover:bg-ink-50"
                )}
              >
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-paper text-accent-600 shadow-card">
                  <CloudUpload size={22} />
                </span>
                <p className="text-sm font-semibold text-ink-900">
                  Drag &amp; drop files here, or click to browse
                </p>
                <p className="mt-1 text-xs text-ink-400">
                  PDF, images, DOCX, PPTX or ZIP · up to 25 MB each
                </p>
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  accept={ACCEPT}
                  className="hidden"
                  onChange={(e) => {
                    handleFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>

              {(files.length > 0 || uploadingNames.length > 0) && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {files.map((f) => (
                    <li
                      key={f.url}
                      className="pill border border-ink-200 bg-paper py-1.5 pl-3 pr-1.5 text-ink-700"
                    >
                      <FileText size={13} className="text-accent-600" />
                      <span className="max-w-[200px] truncate">
                        {f.fileName}
                      </span>
                      <span className="text-ink-400">{f.sizeKb} KB</span>
                      <button
                        type="button"
                        onClick={() => removeFile(f.url)}
                        className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                        aria-label={`Remove ${f.fileName}`}
                      >
                        <X size={12} />
                      </button>
                    </li>
                  ))}
                  {uploadingNames.map((n) => (
                    <li
                      key={n}
                      className="pill border border-ink-100 bg-ink-50 py-1.5 text-ink-400"
                    >
                      <LoaderCircle size={13} className="animate-spin" />
                      <span className="max-w-[200px] truncate">{n}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-8">
                <label className="label" htmlFor="rq-instructions">
                  Anything the writer should know?
                </label>
                <textarea
                  id="rq-instructions"
                  className="input min-h-[110px]"
                  placeholder="e.g. Unit 3 is the most important. Skip the solved examples in the PDF — I only need theory. Write formulas in boxes."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  maxLength={4000}
                />
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="card p-6 sm:p-8">
              <h2 className="font-display text-2xl font-semibold text-ink-950">
                How many pages, roughly?
              </h2>
              <p className="mt-1.5 text-sm text-ink-500">
                An estimate is enough — writers confirm the final count in
                their offers.
              </p>
              <div className="mt-6 flex max-w-xs items-end gap-3">
                <div className="flex-1">
                  <label className="label" htmlFor="rq-pages">
                    Estimated pages
                  </label>
                  <input
                    id="rq-pages"
                    type="number"
                    min={1}
                    max={5000}
                    inputMode="numeric"
                    className="input"
                    placeholder="e.g. 40"
                    value={estPages}
                    disabled={pagesUnknown}
                    onChange={(e) => setEstPages(e.target.value)}
                  />
                </div>
                <span className="pb-2.5 text-sm text-ink-400">pages</span>
              </div>
              <label className="mt-5 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-ink-300 accent-accent-600"
                  checked={pagesUnknown}
                  onChange={(e) => setPagesUnknown(e.target.checked)}
                />
                <span>
                  <span className="block text-sm font-medium text-ink-900">
                    I don&apos;t know — let writers estimate
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-400">
                    Writers will look at your source material and quote a page
                    count with their offer.
                  </span>
                </span>
              </label>
              {triedNext && !stepValid(3) && (
                <p className="mt-4 text-sm font-medium text-red-600">
                  Enter an estimate, or tick &quot;let writers estimate&quot;.
                </p>
              )}
            </section>
          )}

          {step === 4 && (
            <section className="card p-6 sm:p-8">
              <h2 className="font-display text-2xl font-semibold text-ink-950">
                How should it be written?
              </h2>
              <p className="mt-1.5 text-sm text-ink-500">
                Pick a writing style. Writers also show handwriting samples on
                their profiles.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {WRITING_STYLES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setWritingStyle(s.value)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-all active:scale-[0.99]",
                      writingStyle === s.value
                        ? "border-accent-600 bg-accent-50 ring-2 ring-accent-100"
                        : "border-ink-200 bg-paper hover:border-ink-400"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-ink-950">
                        {s.label}
                      </span>
                      {writingStyle === s.value && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-600 text-white">
                          <Check size={12} />
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-ink-500">
                      {STYLE_BLURBS[s.value]}
                    </p>
                  </button>
                ))}
              </div>
              {writingStyle === "CUSTOM" && (
                <textarea
                  className="input mt-4 min-h-[90px]"
                  placeholder="Describe the style you want — e.g. headings in caps, definitions underlined, two-colour diagrams…"
                  value={customStyleText}
                  onChange={(e) => setCustomStyleText(e.target.value)}
                  maxLength={500}
                  autoFocus
                />
              )}

              {isPhysical && (
                <div className="mt-10 border-t border-ink-100 pt-8">
                  <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-ink-950">
                    <NotebookPen size={19} className="text-accent-600" />
                    Notebook requirements
                  </h3>
                  <p className="mt-1.5 text-sm text-ink-500">
                    Since these notes will be handwritten, tell the writer how
                    the notebook should look.
                  </p>

                  <div className="mt-6 grid gap-6 sm:grid-cols-2">
                    <div>
                      <span className="label">Notebook size</span>
                      <div className="flex flex-wrap gap-2">
                        {NOTEBOOK_SIZES.map((s) => (
                          <ChipButton
                            key={s.value}
                            active={notebookSize === s.value}
                            onClick={() =>
                              setNotebookSize(
                                notebookSize === s.value ? "" : s.value
                              )
                            }
                          >
                            {s.label}
                          </ChipButton>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="label">Pen colour</span>
                      <div className="flex flex-wrap gap-2">
                        {PEN_COLORS.map((c) => (
                          <ChipButton
                            key={c.value}
                            active={penColor === c.value}
                            onClick={() =>
                              setPenColor(penColor === c.value ? "" : c.value)
                            }
                          >
                            {c.label}
                          </ChipButton>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="label">Paper</span>
                      <div className="flex gap-2">
                        {[
                          { v: "RULED", l: "Ruled" },
                          { v: "UNRULED", l: "Unruled" },
                        ].map((o) => (
                          <ChipButton
                            key={o.v}
                            active={ruled === o.v}
                            onClick={() => setRuled(ruled === o.v ? "" : o.v)}
                          >
                            {o.l}
                          </ChipButton>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="label">Sides</span>
                      <div className="flex gap-2">
                        {[
                          { v: "SINGLE", l: "One side only" },
                          { v: "BOTH", l: "Both sides" },
                        ].map((o) => (
                          <ChipButton
                            key={o.v}
                            active={sides === o.v}
                            onClick={() => setSides(sides === o.v ? "" : o.v)}
                          >
                            {o.l}
                          </ChipButton>
                        ))}
                      </div>
                    </div>
                  </div>

                  <label className="mt-6 flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-ink-300 accent-accent-600"
                      checked={margins}
                      onChange={(e) => setMargins(e.target.checked)}
                    />
                    <span className="text-sm font-medium text-ink-900">
                      Draw margins on every page
                    </span>
                  </label>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="rq-headings">
                        Heading style (optional)
                      </label>
                      <input
                        id="rq-headings"
                        className="input"
                        placeholder="e.g. Caps with underline, coloured pens ok"
                        value={headingStyle}
                        onChange={(e) => setHeadingStyle(e.target.value)}
                        maxLength={200}
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor="rq-diagrams">
                        Diagram requirements (optional)
                      </label>
                      <input
                        id="rq-diagrams"
                        className="input"
                        placeholder="e.g. Redraw all circuit diagrams neatly"
                        value={diagramReqs}
                        onChange={(e) => setDiagramReqs(e.target.value)}
                        maxLength={500}
                      />
                    </div>
                  </div>
                </div>
              )}

              {triedNext && !stepValid(4) && (
                <p className="mt-4 text-sm font-medium text-red-600">
                  Pick a writing style to continue.
                </p>
              )}
            </section>
          )}

          {step === 5 && (
            <section className="card p-6 sm:p-8">
              <h2 className="font-display text-2xl font-semibold text-ink-950">
                Budget, deadline &amp; delivery
              </h2>
              <p className="mt-1.5 text-sm text-ink-500">
                Writers bid within your range — you pay only after you pick one.
              </p>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="rq-bmin">
                    Budget range (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="rq-bmin"
                      type="number"
                      min={50}
                      inputMode="numeric"
                      className="input"
                      placeholder="Min"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                    />
                    <span className="text-ink-400">–</span>
                    <input
                      type="number"
                      min={50}
                      inputMode="numeric"
                      className="input"
                      placeholder="Max"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                    />
                  </div>
                  {Number.isInteger(minB) &&
                    Number.isInteger(maxB) &&
                    minB > 0 &&
                    maxB >= minB &&
                    !pagesUnknown &&
                    Number.isInteger(pages) &&
                    pages > 0 && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-mint-700">
                        <IndianRupee size={12} />≈ ₹
                        {Math.round(minB / pages).toLocaleString("en-IN")}–₹
                        {Math.round(maxB / pages).toLocaleString("en-IN")}/page
                        for {pages} pages
                      </p>
                    )}
                  {triedNext &&
                    (!Number.isInteger(minB) ||
                      !Number.isInteger(maxB) ||
                      maxB < minB) && (
                      <p className="mt-2 text-xs font-medium text-red-600">
                        Enter a valid range — max must be at least the min.
                      </p>
                    )}
                </div>
                <div>
                  <label className="label" htmlFor="rq-deadline">
                    Deadline
                  </label>
                  <input
                    id="rq-deadline"
                    type="date"
                    className="input"
                    min={tomorrow}
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                  {triedNext && (deadline === "" || deadline < tomorrow) && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      Pick a date from tomorrow onwards.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <span className="label">Delivery method</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("DIGITAL")}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border p-4 text-left transition-all active:scale-[0.99]",
                      deliveryMethod === "DIGITAL"
                        ? "border-accent-600 bg-accent-50 ring-2 ring-accent-100"
                        : "border-ink-200 bg-paper hover:border-ink-400"
                    )}
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-paper text-accent-600 shadow-card">
                      <Download size={17} />
                    </span>
                    <span>
                      <span className="block font-semibold text-ink-950">
                        Digital delivery
                      </span>
                      <span className="mt-0.5 block text-sm text-ink-500">
                        Scans / PDF delivered right here on Notely.
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("PHYSICAL")}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border p-4 text-left transition-all active:scale-[0.99]",
                      deliveryMethod === "PHYSICAL"
                        ? "border-accent-600 bg-accent-50 ring-2 ring-accent-100"
                        : "border-ink-200 bg-paper hover:border-ink-400"
                    )}
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-paper text-accent-600 shadow-card">
                      <Truck size={17} />
                    </span>
                    <span>
                      <span className="block font-semibold text-ink-950">
                        Physical hand-off
                      </span>
                      <span className="mt-0.5 block text-sm text-ink-500">
                        Notebook handed over on campus or couriered.
                      </span>
                    </span>
                  </button>
                </div>
                {deliveryMethod === "PHYSICAL" && (
                  <textarea
                    className="input mt-4 min-h-[90px]"
                    placeholder="Hand-off details — e.g. Collect from the C-block hostel gate, weekday evenings. Or courier to…"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    maxLength={1000}
                    autoFocus
                  />
                )}
                {triedNext &&
                  deliveryMethod === "PHYSICAL" &&
                  deliveryNotes.trim().length < 5 && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      Add a line about how the notes should reach you.
                    </p>
                  )}
              </div>

              {/* ---------- Review summary ---------- */}
              <div className="mt-10 rounded-2xl border border-ink-100 bg-cream/60 p-5 sm:p-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-500">
                  <Sparkles size={15} className="text-accent-600" />
                  Review your request
                </h3>
                <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                  <SummaryRow label="Title" value={title.trim() || "—"} wide />
                  <SummaryRow label="Subject" value={finalSubject || "—"} />
                  <SummaryRow label="Note type" value={noteTypeLabel || "—"} />
                  <SummaryRow
                    label="Pages"
                    value={
                      pagesUnknown
                        ? "Writers will estimate"
                        : Number.isInteger(pages)
                          ? `~${pages} pages`
                          : "—"
                    }
                  />
                  <SummaryRow
                    label="Writing style"
                    value={writingStyleLabel || "—"}
                  />
                  {isPhysical && (
                    <SummaryRow
                      label="Notebook"
                      value={
                        [
                          notebookSize &&
                            (NOTEBOOK_SIZES.find((s) => s.value === notebookSize)
                              ?.label ?? notebookSize),
                          ruled && (ruled === "RULED" ? "Ruled" : "Unruled"),
                          sides &&
                            (sides === "SINGLE"
                              ? "One side"
                              : "Both sides"),
                          penColor &&
                            `${PEN_COLORS.find((c) => c.value === penColor)?.label ?? penColor} pen`,
                          margins && "Margins",
                        ]
                          .filter(Boolean)
                          .join(" · ") || "No specifics"
                      }
                      wide
                    />
                  )}
                  <SummaryRow
                    label="Budget"
                    value={
                      Number.isInteger(minB) && Number.isInteger(maxB)
                        ? `${inr(minB)} – ${inr(maxB)}`
                        : "—"
                    }
                  />
                  <SummaryRow
                    label="Deadline"
                    value={deadline ? formatDate(deadline) : "—"}
                  />
                  <SummaryRow
                    label="Delivery"
                    value={
                      deliveryMethod === "DIGITAL"
                        ? "Digital (scans / PDF)"
                        : "Physical hand-off"
                    }
                  />
                  <SummaryRow
                    label="Source files"
                    value={
                      files.length > 0
                        ? `${files.length} file${files.length === 1 ? "" : "s"} attached`
                        : "None"
                    }
                  />
                </dl>
              </div>
            </section>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        {/* ---------- Footer nav ---------- */}
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0 || submitting}
            className="btn-ghost btn-md"
          >
            <ChevronLeft size={16} /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={goNext} className="btn-primary btn-lg">
              Continue <ChevronRight size={17} />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="btn-accent btn-lg"
            >
              {submitting ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Posting…
                </>
              ) : (
                <>
                  Post request <PenLine size={16} />
                </>
              )}
            </button>
          )}
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-400">
          {step < STEPS.length - 1 ? (
            <BookOpen size={13} />
          ) : (
            <CalendarDays size={13} />
          )}
          {step < STEPS.length - 1
            ? "Your request is saved only when you post it on the last step."
            : "Posting is free. You pay only after accepting a writer's offer — and the money is held safely until you approve the notes."}
        </p>
      </div>
    </div>
  );
}

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all active:scale-[0.97]",
        active
          ? "border-accent-600 bg-accent-50 text-accent-700"
          : "border-ink-200 bg-paper text-ink-700 hover:border-ink-400"
      )}
    >
      {children}
    </button>
  );
}

function SummaryRow({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={cn(wide && "sm:col-span-2")}>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-ink-900">{value}</dd>
    </div>
  );
}
