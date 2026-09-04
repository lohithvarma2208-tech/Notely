// One-off: load Google OAuth credentials from the client_secret JSON into .env
// without printing the secret.
const fs = require("fs");
const path = require("path");

const file = fs
  .readdirSync(process.cwd())
  .find((f) => f.startsWith("client_secret_") && f.endsWith(".json"));
if (!file) throw new Error("client_secret_*.json not found in project root");

const j = JSON.parse(fs.readFileSync(file, "utf8"));
const w = j.web || j.installed;
if (!w?.client_id || !w?.client_secret) throw new Error("unexpected JSON shape");

fs.appendFileSync(
  path.join(process.cwd(), ".env"),
  [
    "",
    `GOOGLE_CLIENT_ID="${w.client_id}"`,
    `GOOGLE_CLIENT_SECRET="${w.client_secret}"`,
    `GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"`,
    "",
  ].join("\n")
);

console.log("credentials file:", file);
console.log("client_id:", w.client_id);
console.log("secret loaded:", (w.client_secret || "").length, "chars (not printed)");
console.log("redirect_uris registered in file:", JSON.stringify(w.redirect_uris ?? []));
