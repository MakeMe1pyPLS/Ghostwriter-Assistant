// Bundles the API server into one file for the Vercel function in api/.
// Runs after `vite build` (see vercel.json → buildCommand).
import { build } from "esbuild";

await build({
  entryPoints: ["server/vercel.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "dist/fn/server.cjs",
  // Resolved through tsconfig.json "paths" (@shared/…, @/…).
  tsconfig: "tsconfig.json",
  // Only used by the local dev server, never by the function.
  external: ["vite", "./vite", "lightningcss", "@tailwindcss/vite", "@vitejs/plugin-react"],
  define: { "process.env.NODE_ENV": '"production"' },
  minify: true,
  sourcemap: false,
  logLevel: "info",
  legalComments: "none",
});
