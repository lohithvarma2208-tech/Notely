// Picks the Prisma schema matching DATABASE_URL: Postgres (Supabase) in
// production, SQLite locally. Used by the `postinstall` hook so Vercel
// builds generate a Postgres-capable client.
const { execSync } = require("child_process");

const url = process.env.DATABASE_URL || "";
const schema = url.startsWith("postgres")
  ? "prisma/schema.postgres.prisma"
  : "prisma/schema.prisma";

console.log(`[prisma-generate] DATABASE_URL is ${url.startsWith("postgres") ? "postgres" : "sqlite/other"} — using ${schema}`);
execSync(`npx prisma generate --schema ${schema}`, { stdio: "inherit" });
