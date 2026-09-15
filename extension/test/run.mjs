// Bundles the .test.ts files with esbuild (already present via @raycast/api) and runs them with node:test.
// Only pure modules (no @raycast/api imports) are exercised here.
import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const outdir = join(process.cwd(), ".test-build");
rmSync(outdir, { recursive: true, force: true });
const entryPoints = readdirSync("test")
  .filter((f) => f.endsWith(".test.ts"))
  .map((f) => join("test", f));
await build({ entryPoints, bundle: true, platform: "node", format: "esm", outdir, logLevel: "error", external: ["@raycast/api", "@raycast/utils", "react"] });
const res = spawnSync(process.execPath, ["--test", ...readdirSync(outdir).map((f) => join(outdir, f))], { stdio: "inherit" });
process.exit(res.status ?? 1);
