import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApplyError } from "../proposals/apply.js";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (status = 404, message = "Не найдено") =>
  new HttpError(status, "not_found", message);

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { code: "not_found", message: "Маршрут не найден" } });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: { code: "validation", message: "Неверные данные запроса", details: err.issues },
    });
    return;
  }
  if (err instanceof ApplyError) {
    const status = err.code === "already_decided" ? 409 : err.code === "not_found" ? 404 : 400;
    res.status(status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: { code: "internal", message: "Внутренняя ошибка сервера" } });
}
