/// <reference lib="webworker" />
// This file is excluded from the app-wide tsconfig (see tsconfig.json) because
// the "webworker" lib conflicts with the "dom" lib used by the rest of the
// Next.js app; Serwist's own build step transpiles this file independently.
import { defaultCache } from "@serwist/next/worker";
import { Serwist, NetworkOnly, StaleWhileRevalidate, CacheFirst, ExpirationPlugin } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare const self: ServiceWorkerGlobalScope &
  SerwistGlobalConfig & {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  };

// Offline strategy (see PWA_STRATEGY.md): the card catalog is the natural
// offline win (read-only, changes rarely), so it gets a stale-while-revalidate
// cache. Inventory/trades/chat require a live session + Realtime and are
// intentionally left off the runtime caching list (NetworkOnly, the default
// for anything not matched below) — no background-sync write queue in this
// slice.
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.pathname.startsWith("/cards"),
      handler: new StaleWhileRevalidate({ cacheName: "cards-pages" }),
    },
    {
      matcher: ({ url, sameOrigin }) =>
        !sameOrigin && /\.(?:png|jpg|jpeg|webp|gif|svg)$/.test(url.pathname),
      handler: new CacheFirst({
        cacheName: "card-images",
        plugins: [new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60 })],
      }),
    },
    {
      matcher: ({ url }) =>
        url.pathname.startsWith("/inventory") ||
        url.pathname.startsWith("/trades") ||
        url.pathname.startsWith("/api"),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
