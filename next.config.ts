import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // No 'standalone' output — Netlify plugin handles its own adapter
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
