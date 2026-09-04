import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/**
 * Notely ships with NO demo data. This seed wipes every table except
 * PlatformConfig (delete order matters for foreign keys) and then ensures
 * the PlatformConfig defaults exist. Users register their own accounts;
 * platform settings are managed from the admin panel.
 */
const CONFIG_DEFAULTS: Record<string, string> = {
  platformFeePercent: "10",
  minOfferRupees: "50",
  maxOfferRupees: "100000",
  subscriptionPriceInr: "100",
  subscriptionTrialDays: "60",
};

async function main() {
  console.log("Wiping all data…");
  await db.notification.deleteMany();
  await db.transaction.deleteMany();
  await db.review.deleteMany();
  await db.message.deleteMany();
  await db.progressUpdate.deleteMany();
  await db.order.deleteMany();
  await db.offer.deleteMany();
  await db.sourceFile.deleteMany();
  await db.noteRequest.deleteMany();
  await db.handwritingSample.deleteMany();
  await db.writerProfile.deleteMany();
  await db.user.deleteMany();

  console.log("Ensuring PlatformConfig defaults…");
  for (const [key, value] of Object.entries(CONFIG_DEFAULTS)) {
    await db.platformConfig.upsert({
      where: { key },
      create: { key, value },
      update: {}, // never overwrite an admin-configured value
    });
  }

  console.log(
    "Done. Clean database with config defaults only — no demo accounts."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
