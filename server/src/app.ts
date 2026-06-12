import express, { type Express } from "express";
import helmet from "helmet";
import compression from "compression";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { DB } from "./db/index.js";
import { basicAuth } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import { personsRouter } from "./routes/persons.js";
import { claimsRouter } from "./routes/claims.js";
import { relationshipsRouter } from "./routes/relationships.js";
import { sourcesRouter } from "./routes/sources.js";
import {
  eventsRouter, placesRouter, proposalsRouter, tasksRouter,
  historyRouter, treeRouter, healthRouter,
} from "./routes/misc.js";
import { importRouter } from "./routes/import.js";
import { assistantRouter } from "./routes/assistant.js";
import { isAiConfigured } from "./ai/client.js";

export interface AppOptions {
  db: DB;
  /** Каталог данных для загрузок; null — без файлового хранилища (тесты). */
  dataDir: string | null;
  /** "user:pass" для Basic Auth; undefined — выключено. */
  basicAuthCredentials?: string;
}

export function createApp(opts: AppOptions): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(basicAuth(opts.basicAuthCredentials));

  app.use("/api/health", healthRouter(isAiConfigured));
  app.use("/api/persons", personsRouter(opts.db));
  app.use("/api/claims", claimsRouter(opts.db));
  app.use("/api/relationships", relationshipsRouter(opts.db));
  app.use("/api/sources", sourcesRouter(opts.db, opts.dataDir));
  app.use("/api/events", eventsRouter(opts.db));
  app.use("/api/places", placesRouter(opts.db));
  app.use("/api/proposals", proposalsRouter(opts.db));
  app.use("/api/tasks", tasksRouter(opts.db));
  app.use("/api/history", historyRouter(opts.db));
  app.use("/api/tree", treeRouter(opts.db));
  app.use("/api/import", importRouter(opts.db, opts.dataDir));
  app.use("/api/assistant", assistantRouter(opts.db));

  // Статика клиента в продакшне (client/dist копируется рядом при сборке образа).
  const here = path.dirname(fileURLToPath(import.meta.url));
  for (const candidate of [path.join(here, "../public"), path.join(here, "../../client/dist")]) {
    if (fs.existsSync(path.join(candidate, "index.html"))) {
      app.use(express.static(candidate));
      app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(candidate, "index.html")));
      break;
    }
  }

  app.use("/api", notFoundHandler);
  app.use(errorHandler);
  return app;
}
