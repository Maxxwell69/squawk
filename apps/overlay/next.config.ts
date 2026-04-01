import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.join(__dirname, "..", "..");

const nextConfig: NextConfig = {
  transpilePackages: ["@captain-squawks/shared"],
  outputFileTracingRoot: workspaceRoot,
  /** Standalone output uses symlinks; enable for Docker/Linux (see Dockerfile `DOCKER_BUILD`). */
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" as const } : {}),
};

export default nextConfig;
