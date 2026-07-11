import * as cheerio from "cheerio";
import type { RawCardRecord, SourceAdapter } from "../adapter";

// ILLUSTRATIVE TEMPLATE — not pointed at a real site.
//
// Demonstrates the shape of a static-HTML scrape adapter: fetch a page,
// select repeated card-listing elements, and map each to a RawCardRecord
// that normalize.ts can validate. Before pointing this at a real card
// price-guide site, read DATA_INGESTION_STRATEGY.md and confirm the target
// site's robots.txt / terms of service permit automated scraping.
//
// Expected illustrative DOM shape:
// <div class="card-row" data-id="123">
//   <span class="card-name">Player Name</span>
//   <span class="card-team">Team</span>
//   <span class="card-rarity">Super Rare</span>
//   <span class="card-ovr">87</span>
//   <span class="card-price">4.50</span>
//   <img class="card-image" src="https://example.com/card.jpg" />
// </div>
export const exampleCheerioAdapter: SourceAdapter = {
  id: "cheerio:example",
  description: "Illustrative static-HTML scrape template (not a real target site)",
  async fetchRaw(options) {
    const url = options.url;
    if (!url) {
      throw new Error(
        "cheerio:example requires --url=<page> pointing at a page matching the documented illustrative DOM shape"
      );
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    const records: RawCardRecord[] = [];
    $(".card-row").each((_, el) => {
      const row = $(el);
      records.push({
        external_ref: row.attr("data-id"),
        name: row.find(".card-name").text().trim(),
        team: row.find(".card-team").text().trim(),
        rarity: row.find(".card-rarity").text().trim(),
        ovr_rating: row.find(".card-ovr").text().trim(),
        base_price: row.find(".card-price").text().trim().replace(/[^0-9.]/g, ""),
        image_url: row.find(".card-image").attr("src"),
      });
    });

    return records;
  },
};
