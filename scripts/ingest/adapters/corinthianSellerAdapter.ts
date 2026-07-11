import type { RawCardRecord, SourceAdapter } from "../adapter";

// Real scrape adapter(s) for Match Attax checklists listed at corinthianseller.co.uk. Unlike
// exampleCheerioAdapter.ts (illustrative only), this is pointed at a real site — see
// DATA_INGESTION_STRATEGY.md for the checklist that was worked through before writing this:
// robots.txt allows these pages (only /ads/, /includes/, /nav/, /pages/, /process/, and
// payment-callback pages are disallowed) but sets `crawl-delay: 10`, which this adapter respects
// by fetching sub-pages sequentially with a delay between each request.
//
// The site's HTML is old-school table markup with a lot of malformed closing tags (literally
// "<\td>" / "<\tr>" / "<\th>" instead of "</td>" etc.), which breaks cheerio's normal
// child-selector traversal partway through most card blocks. Opening tags are consistently
// well-formed, though, so this adapter leans on two techniques instead of DOM child selectors:
//   1. Attribute-anchored regexes (alt=, src=, class=, name=/value= on hidden inputs) — reliable
//      everywhere since they live in opening tags.
//   2. Stripping *all* tags (well-formed or not — both are still "<...>" tokens) from a card block
//      and reading the remaining free-text lines in order, for the fields with no label prefix
//      (team/position).
//
// This exact markup/URL convention (index page `cards-{product-slug}.php` linking to sub-pages
// `{product-slug}-cards-{item}.php`) holds across every Match Attax season and product on the
// site — verified against seasons back to 2021/22 — so everything below is a config-driven
// factory rather than being specific to one season.
const BASE_URL = "https://www.corinthianseller.co.uk/";
const CARD_BLOCK_PATTERN = /<table[^>]*class="cards"[^>]*>[\s\S]*?<\/table>/gi;
const USER_AGENT =
  "BittsAttaxSeeder/1.0 (one-time catalog import for a personal card-trading hobby project)";
const CRAWL_DELAY_MS = 10_000;
const POSITION_WORDS = ["Goalkeeper", "Defender", "Midfielder", "Forward", "Captain"];

export interface CorinthianSellerProductConfig {
  id: string;
  description: string;
  indexUrl: string;
  // Exact URL prefix for this product's sub-pages, e.g. "match-attax-2024-cards-". Must be
  // specific per product — some index pages contain a stray cross-link to a different product's
  // page, and a loose "any -cards- link" filter would wrongly sweep those in too.
  subpagePrefix: string;
  setName: string;
  season: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveUrl(path: string): string {
  return new URL(path.replace(/\\/g, "/"), BASE_URL).toString();
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function extractSubpageUrls(indexHtml: string, subpagePrefix: string): string[] {
  const pattern = new RegExp(`href="([^"]*${subpagePrefix}[a-z0-9-]+\\.php)"`, "gi");
  const hrefs = [...indexHtml.matchAll(pattern)].map((m) => m[1]);
  return [...new Set(hrefs)].map(resolveUrl);
}

function parseTeamPositionLine(line: string | undefined): {
  team: string | undefined;
  position: string | undefined;
} {
  if (!line) return { team: undefined, position: undefined };
  const position = POSITION_WORDS.find((word) => line.endsWith(word));
  if (position) {
    const team = line.slice(0, line.length - position.length).trim();
    return { team: team || undefined, position };
  }
  return { team: line, position: undefined };
}

function parseCardBlock(
  block: string,
  labels: Pick<CorinthianSellerProductConfig, "setName" | "season">
): RawCardRecord | null {
  const name = /alt="([^"]+)"/.exec(block)?.[1]?.trim();
  if (!name) return null;

  const rawSrc = /src="([^"]+)"/.exec(block)?.[1];
  const image_url = rawSrc ? resolveUrl(rawSrc) : undefined;

  const cardNumber = /Card Number:\s*([^<]+)/i.exec(block)?.[1]?.trim();
  const codeFromFilename = rawSrc ? /[a-z0-9]+-([a-z0-9]+)-/i.exec(rawSrc)?.[1] : undefined;
  const external_ref = codeFromFilename ?? cardNumber;

  const cardtype = /class="cardtype">([^<]*)/i.exec(block)?.[1]?.trim();

  const statsMatch = /Defence:\s*(\d+)\s*\/\s*Attack:\s*(\d+)/i.exec(block);
  const defence = statsMatch ? Number(statsMatch[1]) : undefined;
  const attack = statsMatch ? Number(statsMatch[2]) : undefined;
  const ovr_rating =
    defence !== undefined && attack !== undefined ? Math.round((defence + attack) / 2) : undefined;

  const price = /name="price"[^>]*value="([^"]*)"/i.exec(block)?.[1];
  const sku = /name="buy"[^>]*value="([^"]*)"/i.exec(block)?.[1];
  const in_stock = sku !== undefined;
  const maxPerCustomer = /Maximum (\d+) cards? per customer/i.exec(block)?.[1];

  // Free-text lines with no label prefix (team/position, or an item description like "Team
  // Badge") only make sense relative to each other, so read them off the tag-stripped block
  // rather than trying to regex them out directly.
  const textTokens = block
    .replace(/<[^>]*>/g, "|")
    .split("|")
    .map((s) => s.replace(/&nbsp;/gi, " ").trim())
    .filter(Boolean);
  const cardNumberIndex = textTokens.findIndex((t) => /^Card Number:/i.test(t));
  const middleTokens = cardNumberIndex > 0 ? textTokens.slice(1, cardNumberIndex) : [];
  const teamPositionLine = middleTokens.find(
    (t) => t !== cardtype && !/Defence:\s*\d+\s*\/\s*Attack:\s*\d+/i.test(t)
  );
  const { team, position } = parseTeamPositionLine(teamPositionLine);

  return {
    external_ref,
    name,
    team,
    position,
    // Plain numbered cards carry no cardtype label on this site — that's the actual base/common
    // tier, not an unrecognized rarity, so default explicitly rather than falling through to
    // normalizeRarity's "other" bucket.
    rarity: cardtype ?? "common",
    ovr_rating,
    base_price: price,
    image_url,
    set_name: labels.setName,
    season: labels.season,
    card_number: cardNumber,
    cardtype,
    defence,
    attack,
    sku,
    in_stock,
    max_per_customer: maxPerCustomer ? Number(maxPerCustomer) : undefined,
  };
}

function parsePage(
  html: string,
  labels: Pick<CorinthianSellerProductConfig, "setName" | "season">
): RawCardRecord[] {
  const blocks = html.match(CARD_BLOCK_PATTERN) ?? [];
  return blocks.map((block) => parseCardBlock(block, labels)).filter((r): r is RawCardRecord => r !== null);
}

export function createCorinthianSellerAdapter(config: CorinthianSellerProductConfig): SourceAdapter {
  return {
    id: config.id,
    description: config.description,
    async fetchRaw(options) {
      const indexUrl = options.url ?? config.indexUrl;
      const limit = options.limit ? Number(options.limit) : undefined;

      console.log(`Fetching index page ${indexUrl}...`);
      const indexHtml = await fetchHtml(indexUrl);
      const subpageUrls = extractSubpageUrls(indexHtml, config.subpagePrefix).slice(0, limit);
      console.log(
        `Found ${subpageUrls.length} sub-page(s) to fetch (crawl-delay: ${CRAWL_DELAY_MS}ms).`
      );

      const records: RawCardRecord[] = [];
      for (const [i, url] of subpageUrls.entries()) {
        if (i > 0) await sleep(CRAWL_DELAY_MS);
        console.log(`Fetching ${i + 1}/${subpageUrls.length}: ${url}`);
        try {
          const html = await fetchHtml(url);
          const pageRecords = parsePage(html, config);
          console.log(`  -> ${pageRecords.length} card(s)`);
          records.push(...pageRecords);
        } catch (error) {
          console.warn(`  -> skipping page after fetch error: ${(error as Error).message}`);
        }
      }

      return records;
    },
  };
}

export const corinthianSellerAdapter: SourceAdapter = createCorinthianSellerAdapter({
  id: "cheerio:corinthian-seller-matchattax-2025",
  description:
    "Match Attax 2024/25 checklist scraped from corinthianseller.co.uk (subset + team pages)",
  indexUrl: "https://www.corinthianseller.co.uk/cards-match-attax-2025.php",
  subpagePrefix: "match-attax-2025-cards-",
  setName: "Match Attax 2024/25",
  season: "2024/25",
});
