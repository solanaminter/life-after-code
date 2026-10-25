import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output keeps the Cloud Run image small (see infra/gcp/Dockerfile).
  // Local `npm run dev` / `npm run build` are unaffected.
  output: "standalone",
};

export default nextConfig;
