import type { RawCardRecord, SourceAdapter } from "../adapter";

// ILLUSTRATIVE TEMPLATE — not pointed at a real site.
//
// Demonstrates the pattern for a JS-rendered source that needs a real
// browser: navigate, wait for content, paginate, extract. Puppeteer/full
// Chromium cannot run inside Vercel serverless functions, which is why this
// only ever runs via `npm run seed` on a dev machine, in CI, or on a
// dedicated worker host — never from the Next.js app itself.
//
// Before pointing this at a real card price-guide site, read
// DATA_INGESTION_STRATEGY.md and confirm the target site's robots.txt /
// terms of service permit automated scraping.
export const examplePuppeteerAdapter: SourceAdapter = {
  id: "puppeteer:example",
  description: "Illustrative JS-rendered scrape template (not a real target site)",
  async fetchRaw(options) {
    const url = options.url;
    if (!url) {
      throw new Error(
        "puppeteer:example requires --url=<page> pointing at a page matching the documented illustrative DOM shape"
      );
    }

    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.launch({ headless: true });

    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "networkidle0" });
      await page.waitForSelector(".card-row", { timeout: 10_000 });

      const records = await page.$$eval(".card-row", (rows) =>
        rows.map((row) => ({
          external_ref: row.getAttribute("data-id") ?? undefined,
          name: row.querySelector(".card-name")?.textContent?.trim() ?? "",
          team: row.querySelector(".card-team")?.textContent?.trim(),
          rarity: row.querySelector(".card-rarity")?.textContent?.trim(),
          ovr_rating: row.querySelector(".card-ovr")?.textContent?.trim(),
          base_price: row
            .querySelector(".card-price")
            ?.textContent?.trim()
            .replace(/[^0-9.]/g, ""),
          image_url: row.querySelector(".card-image")?.getAttribute("src") ?? undefined,
        }))
      );

      return records as RawCardRecord[];
    } finally {
      await browser.close();
    }
  },
};
