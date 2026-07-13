import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  // Card images can come from arbitrary CSV/scrape sources until a fixed CDN
  // is chosen — tighten this to specific hostnames before shipping to prod.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    // Server Actions default to a 1MB request body cap — well under a phone
    // photo. Both addToInventory's optional custom photo and scanCardPhoto's
    // scan photo pass a File (up to MAX_IMAGE_BYTES = 8MB, see
    // lib/validation/image.schema.ts) through a Server Action, so the limit
    // needs headroom above that for multipart encoding overhead.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // @techstark/opencv-js (the auto-crop perspective correction in
  // lib/cards/perspectiveCrop.ts, dynamically imported client-side only)
  // conditionally requires Node builtins in its UMD wrapper for its
  // Node-environment branch, which webpack still tries to resolve when
  // bundling for the browser. Per the package's own README, these need to
  // resolve to nothing in the client bundle; scoped to !isServer so the
  // actual server bundle (which never imports this package) is unaffected.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
