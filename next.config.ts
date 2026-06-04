import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // three.js and the R3F ecosystem ship modern ESM; transpiling avoids edge
  // cases with Next's bundler across versions.
  transpilePackages: ["three"],
  images: {
    // Allow CC0 placeholder posters from common open sources (swap later).
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
};

export default nextConfig;
