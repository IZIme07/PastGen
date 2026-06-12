import path from "node:path";
import { pino } from "pino";
import { openDb } from "./db/index.js";
import { createApp } from "./app.js";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });
const port = parseInt(process.env.PORT ?? "8080", 10);
const dataDir = path.resolve(process.env.DATA_DIR ?? "./data");

const db = openDb(dataDir);
const app = createApp({
  db,
  dataDir,
  basicAuthCredentials: process.env.BASIC_AUTH || undefined,
});

const server = app.listen(port, () => {
  logger.info({ port, dataDir, ai: !!process.env.ANTHROPIC_API_KEY }, "PastGen server started");
});

function shutdown(signal: string) {
  logger.info({ signal }, "shutting down");
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
