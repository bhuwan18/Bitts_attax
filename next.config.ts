import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  // Card images can come from arbitrary CSV/scrape sources until a fixed CDN
  // is chosen — tighten this to specific hostnames before shipping to prod.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
