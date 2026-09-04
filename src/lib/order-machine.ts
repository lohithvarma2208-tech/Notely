import type { OrderStatus } from "./constants";

/**
 * The ONLY place order status transitions are defined.
 * API routes must call assertTransition() before persisting a status change;
 * the frontend never sets a status directly — it calls an intent endpoint
 * (pay / start / progress / submit / approve / request-revision / cancel …).
 */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  POSTED: ["OFFERS_RECEIVED", "AWAITING_PAYMENT", "CANCELLED"],
  OFFERS_RECEIVED: ["AWAITING_PAYMENT", "CANCELLED"],
  AWAITING_PAYMENT: ["FUNDED", "CANCELLED"],
  FUNDED: ["IN_PROGRESS", "CANCELLED", "REFUNDED"],
  IN_PROGRESS: ["READY_FOR_REVIEW", "CANCELLED", "DISPUTED"],
  READY_FOR_REVIEW: ["APPROVED", "REVISION_REQUESTED", "DISPUTED"],
  REVISION_REQUESTED: ["READY_FOR_REVIEW", "IN_PROGRESS", "DISPUTED", "CANCELLED"],
  APPROVED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: ["REFUNDED"],
  DISPUTED: ["REFUNDED", "COMPLETED"],
  REFUNDED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: string, to: OrderStatus) {
  if (!canTransition(from as OrderStatus, to)) {
    throw new TransitionError(from, to);
  }
}

export class TransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid order status transition: ${from} → ${to}`);
    this.name = "TransitionError";
  }
}

/** Which actor is allowed to trigger a given target state. */
export const ACTOR_FOR: Partial<Record<OrderStatus, "student" | "writer" | "system">> = {
  AWAITING_PAYMENT: "student", // accepting an offer creates the order
  FUNDED: "system", // payment verification only
  IN_PROGRESS: "writer",
  READY_FOR_REVIEW: "writer",
  REVISION_REQUESTED: "student",
  APPROVED: "student",
  COMPLETED: "system", // derived from APPROVED
  CANCELLED: "student",
  DISPUTED: "student",
  REFUNDED: "system",
};
