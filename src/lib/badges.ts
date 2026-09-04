import type { WriterProfile } from "@prisma/client";

export type Badge = {
  key: string;
  label: string;
  description: string;
};

/**
 * Trust badges are computed from actual database conditions on the writer's
 * denormalized stats — never stored, never fakeable.
 */
export function computeBadges(w: WriterProfile): Badge[] {
  const badges: Badge[] = [];
  if (w.identityVerified)
    badges.push({
      key: "identity",
      label: "Identity Verified",
      description: "Government ID verified by Notely",
    });
  if (w.phoneVerified)
    badges.push({
      key: "phone",
      label: "Phone Verified",
      description: "Phone number confirmed by OTP",
    });
  if (w.jobsCompleted >= 100)
    badges.push({
      key: "jobs100",
      label: "100+ Jobs",
      description: "Completed over 100 note-writing jobs",
    });
  else if (w.jobsCompleted >= 25)
    badges.push({
      key: "experienced",
      label: "Experienced Writer",
      description: "Completed 25+ note-writing jobs",
    });
  if (w.totalPagesWritten >= 1000)
    badges.push({
      key: "pages1000",
      label: "1,000+ Pages",
      description: "Written over 1,000 pages of notes",
    });
  if (w.ratingCount >= 10 && w.ratingAvg >= 4.7)
    badges.push({
      key: "top",
      label: "Top Rated",
      description: "Rated 4.7+ across 10 or more reviews",
    });
  if (w.jobsCompleted >= 10 && w.onTimePercent >= 95)
    badges.push({
      key: "fast",
      label: "Fast Delivery",
      description: "95%+ on-time delivery over 10+ jobs",
    });
  return badges;
}
