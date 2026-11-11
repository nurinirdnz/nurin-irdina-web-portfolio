// Vercel serverless entry: the same Express app, in email-only mode.
// Vercel's disk is temporary, so the database is in-memory and only holds the
// read-only project data from backend/seed/portfolio.json (reloaded on each cold start).
// Contact messages are emailed via Brevo instead of stored; the admin inbox is disabled.
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { openDatabase } from "../backend/src/database.mjs";
import { createApp } from "../backend/src/app.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const origin =
  process.env.APP_ORIGIN ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export default createApp({
  db: openDatabase(":memory:"),
  inbox: false,
  origin,
  production: true,
  frontend: resolve(root, "frontend"),
  trustProxy: 1,
  notifyEmail: process.env.NOTIFY_EMAIL,
  brevoApiKey: process.env.BREVO_API_KEY,
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL,
});
