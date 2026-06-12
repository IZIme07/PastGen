import type { NextFunction, Request, Response } from "express";

/** HTTP Basic Auth, если задано BASIC_AUTH="user:pass". Пусто — выключено. */
export function basicAuth(credentials: string | undefined) {
  if (!credentials || !credentials.includes(":")) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }
  const expected = "Basic " + Buffer.from(credentials).toString("base64");
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization === expected) return next();
    res.setHeader("WWW-Authenticate", 'Basic realm="PastGen"');
    res.status(401).json({ error: { code: "unauthorized", message: "Требуется вход" } });
  };
}
