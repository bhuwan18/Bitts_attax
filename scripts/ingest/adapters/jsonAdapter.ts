import { readFileSync } from "node:fs";
import type { RawCardRecord, SourceAdapter } from "../adapter";

export const jsonAdapter: SourceAdapter = {
  id: "json",
  description: "Reads a JSON array of card records from a local file (--file=./path/to/file.json)",
  async fetchRaw(options) {
    const file = options.file ?? "scripts/data/sample-cards.json";
    const content = readFileSync(file, "utf-8");
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      throw new Error(`Expected ${file} to contain a JSON array of card records`);
    }
    return parsed as RawCardRecord[];
  },
};
