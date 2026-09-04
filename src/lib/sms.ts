/**
 * SMS sending abstraction. Configure TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN /
 * TWILIO_FROM_NUMBER in .env for real delivery. Without keys, runs in a
 * clearly-labelled DEV mode: the SMS is logged to the server console and the
 * OTP is returned to the client so the flow stays testable.
 */
export function smsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER
  );
}

export async function sendSms(
  phone: string,
  message: string
): Promise<{ mode: "TWILIO" | "DEV" }> {
  if (!smsConfigured()) {
    console.log(`[DEV SMS] to ${phone}: ${message}`);
    return { mode: "DEV" };
  }
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const auth = Buffer.from(
    `${sid}:${process.env.TWILIO_AUTH_TOKEN}`
  ).toString("base64");
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: phone,
        From: process.env.TWILIO_FROM_NUMBER!,
        Body: message,
      }),
    }
  );
  if (!res.ok) throw new Error(`SMS send failed: ${res.status}`);
  return { mode: "TWILIO" };
}
