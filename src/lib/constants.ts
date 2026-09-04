// Controlled vocabularies for the marketplace.
// SQLite has no Prisma enums, so these are the single source of truth,
// enforced via zod in API routes.

export const NOTE_TYPES = [
  { value: "HANDWRITTEN", label: "Handwritten Notes" },
  { value: "DIGITAL", label: "Digital Notes" },
  { value: "REWRITE", label: "Rewrite Existing Notes" },
  { value: "PHOTO_TO_CLEAN", label: "Convert Photos to Clean Notes" },
  { value: "PDF_TO_HANDWRITTEN", label: "PDF to Handwritten Notes" },
  { value: "NOTEBOOK_COMPLETION", label: "Notebook Completion" },
] as const;
export type NoteType = (typeof NOTE_TYPES)[number]["value"];

export const WRITING_STYLES = [
  { value: "NORMAL", label: "Normal" },
  { value: "NEAT", label: "Neat" },
  { value: "VERY_NEAT", label: "Very Neat" },
  { value: "EXAM_REVISION", label: "Exam Revision Style" },
  { value: "DETAILED", label: "Detailed Notes" },
  { value: "COMPACT", label: "Compact Notes" },
  { value: "CUSTOM", label: "Custom Instructions" },
] as const;
export type WritingStyle = (typeof WRITING_STYLES)[number]["value"];

export const NOTEBOOK_SIZES = [
  { value: "A4", label: "A4" },
  { value: "A5", label: "A5" },
  { value: "LONG", label: "Long Notebook" },
  { value: "RECORD", label: "Record Book" },
  { value: "CUSTOM", label: "Custom" },
] as const;

export const PEN_COLORS = [
  { value: "BLUE", label: "Blue" },
  { value: "BLACK", label: "Black" },
  { value: "CUSTOM", label: "Custom" },
] as const;

export const SUBJECTS = [
  "Engineering Mathematics",
  "Physics",
  "Chemistry",
  "Java",
  "Python",
  "Computer Science",
  "Machine Learning",
  "Data Structures",
  "Electronics",
  "English",
  "Economics",
  "Biology",
] as const;

export const SAMPLE_STYLES = [
  { value: "NORMAL", label: "Normal Handwriting" },
  { value: "NEAT", label: "Very Neat" },
  { value: "VERY_NEAT", label: "Neat & Slow" },
  { value: "HEADINGS", label: "Heading Styles" },
  { value: "DIAGRAMS", label: "Diagrams" },
  { value: "MATH", label: "Mathematical Notation" },
  { value: "CODE", label: "Programming Notes" },
] as const;
export type SampleStyle = (typeof SAMPLE_STYLES)[number]["value"];

export const LANGUAGES = [
  "English",
  "Hindi",
  "Telugu",
  "Tamil",
  "Kannada",
  "Malayalam",
  "Marathi",
  "Bengali",
] as const;

export const HANDWRITING_STYLES = [
  "Normal",
  "Very Neat",
  "Fast",
  "Exam Revision",
  "Diagrams",
  "Math Notation",
  "Code Notes",
] as const;

export const DELIVERY_METHODS = [
  { value: "DIGITAL", label: "Digital Delivery (PDF / DOCX / scans)" },
  { value: "PHYSICAL", label: "Physical Delivery (hand-off / courier)" },
] as const;

export const DELIVERY_STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "HANDED_OFF", label: "Handed off" },
  { value: "IN_TRANSIT", label: "In transit" },
  { value: "DELIVERED", label: "Delivered" },
] as const;

export const ORDER_STATUSES = [
  "POSTED",
  "OFFERS_RECEIVED",
  "AWAITING_PAYMENT",
  "FUNDED",
  "IN_PROGRESS",
  "READY_FOR_REVIEW",
  "REVISION_REQUESTED",
  "APPROVED",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
  "REFUNDED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; tone: "neutral" | "info" | "warn" | "good" | "bad" }
> = {
  POSTED: { label: "Posted", tone: "neutral" },
  OFFERS_RECEIVED: { label: "Offers received", tone: "info" },
  AWAITING_PAYMENT: { label: "Awaiting payment", tone: "warn" },
  FUNDED: { label: "Payment received", tone: "info" },
  IN_PROGRESS: { label: "In progress", tone: "info" },
  READY_FOR_REVIEW: { label: "Ready for review", tone: "warn" },
  REVISION_REQUESTED: { label: "Revision requested", tone: "warn" },
  APPROVED: { label: "Approved", tone: "good" },
  COMPLETED: { label: "Completed", tone: "good" },
  CANCELLED: { label: "Cancelled", tone: "bad" },
  DISPUTED: { label: "Disputed", tone: "bad" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
};

export const AVAILABILITY = [
  { value: "AVAILABLE", label: "Available now" },
  { value: "BUSY", label: "Busy — takes new orders" },
  { value: "AWAY", label: "Away" },
] as const;
