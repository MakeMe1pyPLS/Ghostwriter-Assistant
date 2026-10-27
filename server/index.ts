import { createApp } from "./app";
import { serveStatic } from "./static";

import { log } from "./app";

// Local and self-hosted server. On Vercel the same app runs as a function
// (api/[...path].mjs → server/vercel.ts) and Vercel serves the static files.
(async () => {
  const { app, httpServer } = await createApp();
  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const PORT = Number(process.env.PORT) || 5000;
  // Bind to all interfaces so hosting platforms (Replit, Render, Railway, Fly)
  // can reach the app. httpServer (not app.listen) so Vite HMR shares the port.
  httpServer.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
