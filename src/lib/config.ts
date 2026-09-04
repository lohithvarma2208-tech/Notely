import { db } from "./db";

/**
 * Platform configuration lives in the PlatformConfig table so fees and
 * limits are never hardcoded. `DEFAULTS` only seeds missing rows.
 */
export const CONFIG_DEFAULTS: Record<string, string> = {
  platformFeePercent: "10", // deducted from the agreed price
  minOfferRupees: "50",
  maxOfferRupees: "100000",
  subscriptionPriceInr: "100", // monthly, after the free trial
  subscriptionTrialDays: "60", // free trial length (2 months)
};

export async function getConfig(key: string): Promise<string> {
  const row = await db.platformConfig.findUnique({ where: { key } });
  if (row) return row.value;
  const fallback = CONFIG_DEFAULTS[key];
  if (fallback === undefined) throw new Error(`Unknown config key: ${key}`);
  await db.platformConfig.create({ data: { key, value: fallback } });
  return fallback;
}

export async function getConfigNumber(key: string): Promise<number> {
  const n = Number(await getConfig(key));
  if (Number.isNaN(n)) throw new Error(`Config ${key} is not numeric`);
  return n;
}

export async function setConfig(key: string, value: string) {
  await db.platformConfig.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function getPlatformFeePercent(): Promise<number> {
  return getConfigNumber("platformFeePercent");
}

/** Splits an agreed price into platform fee and writer earning. */
export function splitFee(agreedPrice: number, feePct: number) {
  const platformFee = Math.round((agreedPrice * feePct) / 100);
  return { platformFee, writerEarning: agreedPrice - platformFee };
}
