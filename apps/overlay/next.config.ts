import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.join(__dirname, "..", "..");
/** Direct path so webpack resolves in Docker/pnpm (isolated node_modules often breaks workspace:*). */
const sharedSrc = path.join(workspaceRoot, "packages", "shared", "src", "index.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@captain-squawks/shared"],
  outputFileTracingRoot: workspaceRoot,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@captain-squawks/shared": sharedSrc,
    };
    return config;
  },
  /** Standalone output uses symlinks; enable for Docker/Linux (see Dockerfile `DOCKER_BUILD`). */
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" as const } : {}),
};

export default nextConfig;
