import type { User } from "@prisma/client";
import { getConfigNumber } from "./config";

export type SubscriptionState = {
  status: "TRIAL" | "ACTIVE" | "EXPIRED";
  trialDaysLeft: number;
  paidUntil: Date | null;
  priceInr: number;
  trialDays: number;
};

/**
 * Subscription state is computed from timestamps — never stored as a flag,
 * so it can't drift. New users get `trialEndsAt = signup + trialDays`;
 * after that they pay `subscriptionPriceInr` per month. Both values come
 * from PlatformConfig so the admin can edit them at /admin.
 */
export async function getSubscriptionState(
  user: Pick<User, "trialEndsAt" | "subscriptionPaidUntil">
): Promise<SubscriptionState> {
  const [priceInr, trialDays] = await Promise.all([
    getConfigNumber("subscriptionPriceInr"),
    getConfigNumber("subscriptionTrialDays"),
  ]);
  const now = Date.now();
  const paidUntil = user.subscriptionPaidUntil;
  if (paidUntil && paidUntil.getTime() > now) {
    return { status: "ACTIVE", trialDaysLeft: 0, paidUntil, priceInr, trialDays };
  }
  const trialEnds = user.trialEndsAt;
  if (trialEnds && trialEnds.getTime() > now) {
    const trialDaysLeft = Math.ceil((trialEnds.getTime() - now) / 86400000);
    return { status: "TRIAL", trialDaysLeft, paidUntil: null, priceInr, trialDays };
  }
  return { status: "EXPIRED", trialDaysLeft: 0, paidUntil, priceInr, trialDays };
}

export async function hasActiveSubscription(
  user: Pick<User, "trialEndsAt" | "subscriptionPaidUntil">
): Promise<boolean> {
  return (await getSubscriptionState(user)).status !== "EXPIRED";
}

export async function grantTrial(_userId?: string) {
  const trialDays = await getConfigNumber("subscriptionTrialDays");
  return {
    trialEndsAt: new Date(Date.now() + trialDays * 86400000),
  };
}
