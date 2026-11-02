// Builds the Express app (middleware + every /api route) without starting a
// server. Used by server/index.ts (local, self-hosted) and server/vercel.ts
// (Vercel function).
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { registerRoutes } from "./routes";
import { registerPlatformRoutes } from "./platform-routes";
import { HttpError } from "./services/platform/config";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function createApp(): Promise<{ app: Express; httpServer: Server }> {
  const app = express();
  const httpServer = createServer(app);
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  // Keep the raw body: the Stripe webhook signature is checked against it.
  app.use(express.json({ limit: "2mb", verify: (req, _res, buf) => { req.rawBody = buf; } }));
  app.use(express.urlencoded({ extended: false, limit: "2mb" }));

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      if (req.method === "OPTIONS") return res.sendStatus(204);
    }
    next();
  });

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    res.on("finish", () => {
      if (path.startsWith("/api")) log(`${req.method} ${path} ${res.statusCode} in ${Date.now() - start}ms`);
    });
    next();
  });

  // Accounts, billing and AI keys first: they also add the per-request AI
  // access that the AI routes in routes.ts read.
  registerPlatformRoutes(app);
  await registerRoutes(httpServer, app);

  // Unknown /api paths get JSON, not the app's HTML page.
  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, code: err.code });
    const status = err.status || err.statusCode || 500;
    console.error("Internal Server Error:", err);
    return res.status(status).json({ error: status >= 500 ? "Something went wrong on our side. Try again in a moment." : err.message || "Bad request" });
  });

  return { app, httpServer };
}
