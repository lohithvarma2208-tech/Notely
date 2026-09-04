import crypto from "crypto";

/**
 * Payment abstraction. When Razorpay keys are configured we create/verify
 * real Razorpay orders via their REST API. Without keys the app runs in a
 * clearly-labelled MOCK mode so the full order workflow is usable in dev.
 */
export function razorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export type PaymentSession = {
  mode: "RAZORPAY" | "MOCK";
  razorpayOrderId: string;
  keyId: string | null;
  amountPaise: number;
  currency: "INR";
};

export async function createPaymentSession(opts: {
  orderId: string;
  amountRupees: number;
}): Promise<PaymentSession> {
  const amountPaise = opts.amountRupees * 100;
  if (!razorpayConfigured()) {
    return {
      mode: "MOCK",
      razorpayOrderId: `mock_${opts.orderId}`,
      keyId: null,
      amountPaise,
      currency: "INR",
    };
  }
  const auth = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt: opts.orderId,
    }),
  });
  if (!res.ok) throw new Error(`Razorpay order creation failed: ${res.status}`);
  const data = (await res.json()) as { id: string };
  return {
    mode: "RAZORPAY",
    razorpayOrderId: data.id,
    keyId: process.env.RAZORPAY_KEY_ID!,
    amountPaise,
    currency: "INR",
  };
}

export function verifyPaymentSignature(opts: {
  razorpayOrderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!razorpayConfigured()) return false;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${opts.razorpayOrderId}|${opts.paymentId}`)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(opts.signature)
  );
}
