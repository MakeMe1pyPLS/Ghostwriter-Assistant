import { build } from "esbuild";
await build({ entryPoints: ["shared/kpi-stats.ts"], bundle: true, platform: "node", format: "cjs", outfile: "dist/fn/spike.cjs", logLevel: "info" });
