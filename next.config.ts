import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output produces .next/standalone — a minimal server bundle used
  // by the Docker image (small layer, no node_modules duplication).
  output: "standalone",
  images: {
    // Book covers are served through the file-proxy API route with sizing
    // query params (?bucket=...&w=...&h=...). Next requires localPatterns to
    // allow query strings on local image paths. Omitting `search` matches any.
    localPatterns: [
      {
        pathname: "/api/files/**",
      },
    ],
  },
};

export default nextConfig;
