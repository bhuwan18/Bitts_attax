# PWA Strategy

## Package choice: Serwist, not `next-pwa`

The original plan called for `next-pwa`. During implementation we found:

- Upstream `next-pwa` is effectively unmaintained.
- The maintained fork `@ducanh2912/next-pwa` **itself now recommends migrating to
  [`@serwist/next`](https://serwist.pages.dev/docs/next)** (a Workbox fork built by the same
  author) — that notice is right at the top of its own README.

We installed `@serwist/next` (v9.5.11, the `latest` dist-tag — v10 is still `preview`) instead.
Same underlying model (Workbox `injectManifest`), actively maintained, first-class Next.js App
Router support.

**Known limitation:** Serwist's webpack plugin does not yet support Turbopack, which Next.js 16
made the default for both `next dev` and `next build`. `package.json`'s `dev` and `build` scripts
therefore pass `--webpack` explicitly:

```json
"dev": "next dev --webpack",
"build": "next build --webpack"
```

Track [serwist/serwist#54](https://github.com/serwist/serwist/issues/54) for Turbopack support; at
that point the `--webpack` flags can be dropped (or migrated to `@serwist/turbopack`).

## Configuration

### `next.config.ts`
```ts
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});
```
The service worker is disabled in development (standard practice — a stale cached SW during local
dev causes more confusion than it's worth) and only bundled on `next build`. `public/sw.js` is
generated at build time and is gitignored.

### `app/sw.ts`
The actual service worker source, built with the `Serwist` class from the `serwist` package.
**Note:** this file is excluded from the app-wide `tsconfig.json` (`exclude: ["app/sw.ts"]`) —
the `webworker` TypeScript lib it needs conflicts with the `dom` lib the rest of the Next.js app
uses in the same `tsc` program. Serwist's own build step transpiles it independently, so this
doesn't affect the production bundle, only our `npm run typecheck` script.

### `app/manifest.ts`
Next's typed `MetadataRoute.Manifest` export (served at `/manifest.webmanifest`):
- `name`/`short_name`: "Bitts Attax"
- `display: "standalone"`, `orientation: "portrait"`
- `theme_color` / `background_color`: `#0a0a0a`
- Icons: `public/icons/icon.svg` (scalable, `purpose: "any"`) plus generated 192px/512px/maskable-512px
  PNGs. **These PNGs are programmatically generated placeholders** (a simple card-shaped mark on a
  dark background) — swap them for real branded artwork before shipping to production.

## Offline / caching strategy

The guiding principle: **cache what's safe to serve stale, never fake what requires a live session.**

| Route / asset | Strategy | Why |
|---|---|---|
| `/cards`, `/cards/[cardId]` | `StaleWhileRevalidate` | Read-only reference catalog that changes rarely — the natural offline win |
| Card images (cross-origin) | `CacheFirst`, 30-day expiry, 300-entry cap | Static assets, safe to cache aggressively |
| `/inventory`, `/trades`, `/api/*` | `NetworkOnly` | Require a live session and/or Realtime; **no background-sync write queue in this version** — writes made offline are simply not attempted, not silently queued |
| Everything else | Serwist's `defaultCache` (Next.js's recommended precache/runtime rules for static assets, fonts, RSC payloads) | |
| Navigation fallback | `/offline` page | Shown when a document request fails with no network and nothing cached |

This means: a user who's browsed the card catalog can keep browsing it offline (including
previously-viewed card images), but inventory management, trading, and chat correctly require
connectivity — the app does not pretend those work offline.

### Explicitly out of scope (documented, not implemented)
- **Background sync** for offline writes (e.g. queuing an inventory change made offline and
  replaying it on reconnect). Would require Workbox's Background Sync API plus conflict
  resolution on the server side — a meaningfully larger feature, not attempted here.
- **Push notifications** for trade updates/new messages — no `Notification`/`PushManager`
  integration is wired up.

## Manual test checklist

1. `npm run build && npm run start`.
2. Open the app in Chrome/Edge on a mobile viewport (or an actual phone), confirm the "Install
   app" / "Add to Home Screen" prompt appears and the installed app opens in standalone mode
   (no browser chrome).
3. Visit `/cards`, let a few card images load, then go offline (DevTools → Network → Offline) and
   reload `/cards` — the previously-viewed cards and images should still render.
4. While offline, navigate to `/inventory` — the app should show the `/offline` fallback rather
   than a broken network-error page.
5. Go back online and confirm `/inventory` and Realtime chat resume working immediately.
