import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local", quiet: true });

import { adapterRegistry } from "./ingest/adapter";
import { csvAdapter } from "./ingest/adapters/csvAdapter";
import { jsonAdapter } from "./ingest/adapters/jsonAdapter";
import { exampleCheerioAdapter } from "./ingest/adapters/exampleCheerioAdapter";
import { examplePuppeteerAdapter } from "./ingest/adapters/examplePuppeteerAdapter";
import { normalizeRecords } from "./ingest/normalize";
import { upsertCards } from "./ingest/upsertCards";

adapterRegistry.register(csvAdapter);
adapterRegistry.register(jsonAdapter);
adapterRegistry.register(exampleCheerioAdapter);
adapterRegistry.register(examplePuppeteerAdapter);

function parseArgs(argv: string[]): Record<string, string> {
  const options: Record<string, string> = {};
  for (const arg of argv) {
    const match = /^--([^=]+)=(.*)$/.exec(arg);
    if (match) options[match[1]] = match[2];
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const sourceId = options.source ?? "csv";

  if (options.help !== undefined || sourceId === "list") {
    console.log("Available adapters:");
    adapterRegistry.list().forEach((a) => console.log(`  ${a.id.padEnd(20)} ${a.description}`));
    console.log('\nUsage: npm run seed -- --source=csv --file=./scripts/data/sample-cards.csv');
    return;
  }

  const adapter = adapterRegistry.get(sourceId);
  console.log(`Fetching raw records from adapter "${adapter.id}"...`);
  const raw = await adapter.fetchRaw(options);
  console.log(`Fetched ${raw.length} raw records.`);

  const { cards, errors } = normalizeRecords(raw, sourceId);
  console.log(`Normalized ${cards.length} valid card(s), ${errors.length} error(s).`);

  if (errors.length > 0) {
    console.log("First few normalization errors:");
    errors.slice(0, 5).forEach((e) => console.log(`  [row ${e.index}] ${e.message}`));
  }

  if (cards.length === 0) {
    console.log("No valid cards to upsert. Exiting.");
    return;
  }

  const summary = await upsertCards(cards);
  console.log(
    `Done. Attempted ${summary.attempted} row(s) across ${summary.batches} batch(es), upserted ${summary.upserted}.`
  );
}

main().catch((error) => {
  console.error("Seed run failed:", error);
  process.exitCode = 1;
});
