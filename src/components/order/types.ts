// Shared types + helpers for the order room (src/app/orders/[id]).

export type DeliveryFile = {
  fileName: string;
  url: string;
  fileType: string; // PDF | DOCX | PPTX | IMAGE | OTHER
  sizeKb: number;
};

/** order.deliveryFiles is stored as a JSON string in SQLite. */
export function parseDeliveryFiles(json: string | null | undefined): DeliveryFile[] {
  if (!json) return [];
  try {
    const raw = JSON.parse(json) as Array<Partial<DeliveryFile>>;
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((f) => f && typeof f.fileName === "string" && typeof f.url === "string")
      .map((f) => ({
        fileName: f.fileName as string,
        url: f.url as string,
        fileType: typeof f.fileType === "string" ? f.fileType : "OTHER",
        sizeKb: typeof f.sizeKb === "number" ? f.sizeKb : 0,
      }));
  } catch {
    return [];
  }
}

export function formatKb(sizeKb: number): string {
  if (!sizeKb || sizeKb <= 0) return "";
  if (sizeKb < 1024) return `${sizeKb} KB`;
  return `${(sizeKb / 1024).toFixed(1)} MB`;
}

export type ProgressEntry = {
  id: string;
  pagesCompleted: number;
  note: string;
  photoUrl: string | null;
  createdAt: string; // ISO
};

export type ChatMessage = {
  id: string;
  orderId: string;
  senderId: string;
  body: string;
  attachmentUrl: string | null;
  attachmentType: string | null; // IMAGE | DOCUMENT
  readAt: string | null;
  createdAt: string;
  sender: { id: string; name: string; avatarUrl: string | null };
};

/** Shape returned by POST /api/orders/[id]/pay (see src/lib/payments.ts). */
export type PaymentSessionLike = {
  mode: "RAZORPAY" | "MOCK";
  razorpayOrderId: string;
  keyId: string | null;
  amountPaise: number;
  currency: "INR";
};
